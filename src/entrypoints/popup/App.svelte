<script lang="ts">
  import RepoHeader from '../../components/RepoHeader.svelte';
  import RepoPrompt from '../../components/RepoPrompt.svelte';
  import SettingsPanel from '../../components/SettingsPanel.svelte';
  import ToolDeck from '../../components/ToolDeck.svelte';
  import { getActiveTabUrl, openUrl } from '../../lib/browser/active-tab';
  import { parseGitHubRepo } from '../../lib/github/parse-repo';
  import type { RepoRef } from '../../lib/github/types';
  import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../lib/settings';
  import type { Settings } from '../../lib/settings';
  import {
    TOOLS,
    filterTools,
    flattenGroups,
    groupByCategory,
    keyAction,
    resolveTools,
  } from '../../lib/tools';
  import type { ToolStatus } from '../../lib/tools';

  type View =
    { kind: 'loading' } | { kind: 'repo'; repo: RepoRef } | { kind: 'prompt'; message: string };

  let view = $state<View>({ kind: 'loading' });
  let filter = $state('');
  let selectedIndex = $state(0);
  let settings = $state<Settings>(DEFAULT_SETTINGS);
  let settingsOpen = $state(false);
  let openError = $state<string | null>(null);
  let filterInput = $state<HTMLInputElement | null>(null);

  const statuses = $derived<readonly ToolStatus[]>(
    settings.includeUnverified ? ['verified', 'unverified'] : ['verified'],
  );

  const resolution = $derived(
    view.kind === 'repo'
      ? resolveTools(TOOLS, view.repo, { allowedStatuses: statuses })
      : { resolved: [], skipped: [] },
  );

  const visible = $derived(filterTools(resolution.resolved, filter));
  const groups = $derived(groupByCategory(visible));
  const ordered = $derived(flattenGroups(groups));

  const selected = $derived(ordered[Math.min(selectedIndex, ordered.length - 1)]);
  const unavailable = $derived(
    resolution.skipped.filter((entry) => entry.tool.status === 'verified').length,
  );

  $effect(() => {
    void filter;
    selectedIndex = 0;
  });

  void (async () => {
    settings = await loadSettings();
  })();

  void (async () => {
    const url = await getActiveTabUrl();
    const repo = url === null ? null : parseGitHubRepo(url);
    view =
      repo === null
        ? {
            kind: 'prompt',
            message: 'No GitHub repository in this tab. Paste one to build a deck.',
          }
        : { kind: 'repo', repo };
  })();

  function useInput(input: string) {
    const repo = parseGitHubRepo(input);
    if (repo !== null) view = { kind: 'repo', repo };
  }

  function updateSettings(next: Settings) {
    settings = next;
    void saveSettings(next);
  }

  /**
   * Opens a destination and gets out of the way. A background tab is the one
   * case where the popup stays up, so several tools can be opened in a row.
   *
   * A rejection here is the one failure the user cannot otherwise see: the
   * popup would simply sit there after a click that did nothing. It is shown
   * rather than logged, because the popup takes its console with it when it
   * closes.
   */
  function open(url: string) {
    const target = settings.openTarget;
    openError = null;
    void openUrl(url, target).then(
      () => {
        if (target !== 'background-tab') window.close();
      },
      () => {
        openError = 'The browser would not open that tool from this page.';
      },
    );
  }

  function scrollSelectedIntoView() {
    const id = ordered[selectedIndex]?.tool.id;
    if (id === undefined) return;
    queueMicrotask(() => {
      document.querySelector(`[data-tool-id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
    });
  }

  function onkeydown(event: KeyboardEvent) {
    if (view.kind !== 'repo') return;

    const action = keyAction({
      key: event.key,
      modified: event.ctrlKey || event.metaKey || event.altKey,
      typing: document.activeElement === filterInput,
      filterEmpty: filter === '',
      hasResults: ordered.length > 0,
      settingsOpen,
    });
    if (action.type === 'none') return;

    event.preventDefault();
    switch (action.type) {
      case 'focus-filter':
        filterInput?.focus();
        break;
      case 'clear-filter':
        filter = '';
        break;
      case 'close-settings':
        settingsOpen = false;
        break;
      case 'move':
        selectedIndex = (selectedIndex + action.delta + ordered.length) % ordered.length;
        scrollSelectedIntoView();
        break;
      case 'open-selected':
        if (selected !== undefined) open(selected.url);
        break;
      case 'open-index': {
        const entry = ordered[action.index];
        if (entry !== undefined) open(entry.url);
        break;
      }
    }
  }
</script>

<svelte:window {onkeydown} />

<main>
  {#if view.kind === 'loading'}
    <p class="status">Detecting repository…</p>
  {:else if view.kind === 'prompt'}
    <RepoPrompt message={view.message} onresolve={useInput} />
  {:else}
    <RepoHeader
      repo={view.repo}
      onchange={() => (view = { kind: 'prompt', message: 'Which repository?' })}
    />

    {#if settingsOpen}
      <div class="deck">
        <SettingsPanel
          {settings}
          onchange={updateSettings}
          onclose={() => (settingsOpen = false)}
        />
      </div>
    {:else}
      <div class="filter">
        <input
          bind:this={filterInput}
          bind:value={filter}
          type="text"
          spellcheck="false"
          autocomplete="off"
          placeholder="Filter tools — press / to focus"
          aria-label="Filter tools"
        />
      </div>

      <div class="deck">
        {#if resolution.resolved.length === 0}
          <div class="empty">
            <p>No tools available for this page.</p>
            <p class="hint">
              Every tool was skipped. This usually means the registry needs a look — see
              docs/tools.md.
            </p>
          </div>
        {:else if ordered.length === 0}
          <div class="empty">
            <p>Nothing matches “{filter}”.</p>
            <button type="button" onclick={() => (filter = '')}>Clear filter</button>
          </div>
        {:else}
          <ToolDeck {groups} {ordered} selectedId={selected?.tool.id} onopen={open} />
        {/if}
      </div>
    {/if}

    {#if openError !== null}
      <p class="error" role="alert">{openError}</p>
    {/if}

    <footer>
      <span>
        {ordered.length} of {resolution.resolved.length} tools
        {#if unavailable > 0}<span class="faint">· {unavailable} not available here</span>{/if}
      </span>
      <button
        type="button"
        class="settings"
        aria-expanded={settingsOpen}
        onclick={() => (settingsOpen = !settingsOpen)}
      >
        Settings
      </button>
    </footer>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    max-height: 600px;
  }

  .filter {
    padding: 0 var(--space-4) var(--space-2);
  }

  .filter input {
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-subtle);
    color: var(--text);
    font: inherit;
    font-size: 12px;
  }

  .deck {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border-top: 1px solid var(--border);
  }

  .status {
    margin: 0;
    padding: var(--space-4);
    color: var(--text-muted);
  }

  .empty {
    padding: var(--space-4);
    color: var(--text-muted);
    text-align: center;
  }

  .empty p {
    margin: 0;
  }

  .empty .hint {
    margin-top: var(--space-1);
    font-size: 11px;
    color: var(--text-faint);
  }

  .empty button {
    margin-top: var(--space-3);
    padding: 4px 10px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .empty button:hover {
    background: var(--bg-hover);
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--border);
    color: var(--text-faint);
    font-size: 11px;
  }

  .error {
    margin: 0;
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--border);
    color: var(--warn);
    font-size: 11px;
  }

  footer .faint {
    color: var(--text-faint);
  }

  footer .settings {
    flex: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 11px;
    padding: 3px 8px;
    cursor: pointer;
  }

  footer .settings:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
</style>
