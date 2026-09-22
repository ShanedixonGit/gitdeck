<script lang="ts">
  import RepoHeader from '../../components/RepoHeader.svelte';
  import RepoPrompt from '../../components/RepoPrompt.svelte';
  import ToolDeck from '../../components/ToolDeck.svelte';
  import { getActiveTabUrl, openOptions, openUrl } from '../../lib/browser/active-tab';
  import { parseGitHubRepo } from '../../lib/github/parse-repo';
  import type { RepoRef } from '../../lib/github/types';
  import { DEFAULT_SETTINGS, loadSettings } from '../../lib/settings';
  import type { Settings } from '../../lib/settings';
  import { TOOLS, filterTools, keyAction, pickStack, resolveTools } from '../../lib/tools';
  import type { ToolStatus } from '../../lib/tools';

  type View =
    { kind: 'loading' } | { kind: 'repo'; repo: RepoRef } | { kind: 'prompt'; message: string };

  let view = $state<View>({ kind: 'loading' });
  let filter = $state('');
  let selectedIndex = $state(0);
  let settings = $state<Settings>(DEFAULT_SETTINGS);
  let openError = $state<string | null>(null);
  let settingsReady = $state(false);
  let filterInput = $state<HTMLInputElement | null>(null);

  const statuses = $derived<readonly ToolStatus[]>(
    settings.includeUnverified ? ['verified', 'unverified'] : ['verified'],
  );

  const resolution = $derived(
    view.kind === 'repo'
      ? resolveTools(TOOLS, view.repo, { allowedStatuses: statuses })
      : { resolved: [], skipped: [] },
  );

  const chosen = $derived(pickStack(resolution.resolved, settings.stack));
  const ordered = $derived(filterTools(chosen, filter));

  const selected = $derived(ordered[Math.min(selectedIndex, ordered.length - 1)]);
  const unavailable = $derived(settings.stack.length - chosen.length);
  /** Held back until settings load, so it cannot flash for a returning user. */
  const firstRun = $derived(settingsReady && settings.stack.length === 0);

  $effect(() => {
    void filter;
    selectedIndex = 0;
  });

  void (async () => {
    settings = await loadSettings();
    settingsReady = true;
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

  function manage() {
    void openOptions().then(() => window.close());
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

    {#if firstRun}
      <section class="first-run">
        <h2>Build your deck</h2>
        <p>
          Pick the tools you want from {TOOLS.length} on offer. Only those show up here, pointed at whatever
          repository you are on.
        </p>
        <button type="button" class="primary" onclick={manage}>Choose tools</button>
      </section>
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
        {#if chosen.length === 0}
          <div class="empty">
            <p>None of your tools apply to this page.</p>
            <button type="button" onclick={manage}>Add more tools</button>
          </div>
        {:else if ordered.length === 0}
          <div class="empty">
            <p>Nothing matches “{filter}”.</p>
            <button type="button" onclick={() => (filter = '')}>Clear filter</button>
          </div>
        {:else}
          <ToolDeck entries={ordered} selectedId={selected?.tool.id} onopen={open} />
        {/if}
      </div>
    {/if}

    {#if openError !== null}
      <p class="error" role="alert">{openError}</p>
    {/if}

    <footer>
      <span>
        {#if !firstRun}
          {ordered.length} of {settings.stack.length} tools
          {#if unavailable > 0}<span class="faint">· {unavailable} not available here</span>{/if}
        {/if}
      </span>
      <span class="footer-actions">
        <button type="button" class="settings" onclick={manage}>Customise</button>
      </span>
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

  .first-run {
    padding: var(--space-3) var(--space-4) var(--space-4);
    border-top: 1px solid var(--border);
  }

  .first-run h2 {
    margin: 0 0 var(--space-2);
    font-size: 13px;
    font-weight: 600;
  }

  .first-run p {
    margin: 0 0 var(--space-3);
    color: var(--text-muted);
    font-size: 12px;
  }

  .primary {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: var(--accent-contrast);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .primary:hover {
    opacity: 0.9;
  }

  .empty {
    padding: var(--space-4);
    color: var(--text-muted);
    text-align: center;
  }

  .empty p {
    margin: 0;
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

  .footer-actions {
    flex: none;
    display: flex;
    gap: var(--space-1);
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
