<script lang="ts">
  import RepoHeader from '../../components/RepoHeader.svelte';
  import RepoPrompt from '../../components/RepoPrompt.svelte';
  import ToolDeck from '../../components/ToolDeck.svelte';
  import { getActiveTabUrl, openOptions, openUrl } from '../../lib/browser/active-tab';
  import { formatRepoRef, parseGitHubRepo } from '../../lib/github/parse-repo';
  import type { RepoRef } from '../../lib/github/types';
  import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../lib/settings';
  import type { Settings } from '../../lib/settings';
  import {
    TOOLS,
    filterTools,
    keyAction,
    pickStack,
    recommendedStack,
    resolveTools,
  } from '../../lib/tools';
  import type { ResolvedTool, ToolStatus } from '../../lib/tools';

  type View =
    { kind: 'loading' } | { kind: 'repo'; repo: RepoRef } | { kind: 'prompt'; message: string };

  let view = $state<View>({ kind: 'loading' });
  let filter = $state('');
  let selectedIndex = $state(0);
  let settings = $state<Settings>(DEFAULT_SETTINGS);
  let openError = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let settingsReady = $state(false);
  let filterInput = $state<HTMLInputElement | null>(null);
  /** The repository the tab is on, so "Change" can be undone. */
  let detected = $state<RepoRef | null>(null);

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
  const firstRun = $derived(settings.stack.length === 0);

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
    detected = repo;
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

  function goBack() {
    if (detected !== null) view = { kind: 'repo', repo: detected };
  }

  function useRecommended() {
    settings = { ...settings, stack: recommendedStack(TOOLS) };
    void saveSettings(settings);
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
  function open(entry: ResolvedTool) {
    if (entry.tool.action === 'copy') {
      copy(entry.url);
      return;
    }
    const target = settings.openTarget;
    openError = null;
    notice = null;
    void openUrl(entry.url, target).then(
      () => {
        if (target !== 'background-tab') window.close();
      },
      () => {
        openError = 'The browser would not open that tool from this page.';
      },
    );
  }

  /**
   * Copies a tool's text and says so, then closes the popup once the user has
   * had a moment to see it. The keypress or click that got here is the user
   * gesture the clipboard needs, so no extra permission is involved.
   */
  function copy(text: string) {
    openError = null;
    void navigator.clipboard.writeText(text).then(
      () => {
        notice = `Copied ${text}`;
        setTimeout(() => window.close(), 900);
      },
      () => {
        openError = 'The browser would not let GitDeck use the clipboard.';
      },
    );
  }

  /**
   * Keeps focus with the selection. If the user has tabbed onto a card, the
   * arrow keys carry focus along, so Enter always opens the card they can see
   * highlighted.
   */
  function scrollSelectedIntoView() {
    const id = ordered[selectedIndex]?.tool.id;
    if (id === undefined) return;
    const cardFocused = Boolean(document.activeElement?.closest('[data-tool-id]'));
    queueMicrotask(() => {
      const card = document.querySelector<HTMLElement>(`[data-tool-id="${id}"]`);
      if (cardFocused) card?.focus();
      card?.scrollIntoView({ block: 'nearest' });
    });
  }

  function select(entry: ResolvedTool) {
    const index = ordered.findIndex((each) => each.tool.id === entry.tool.id);
    if (index !== -1) selectedIndex = index;
  }

  function onkeydown(event: KeyboardEvent) {
    if (view.kind !== 'repo') return;

    const action = keyAction({
      key: event.key,
      modified: event.ctrlKey || event.metaKey || event.altKey,
      typing: document.activeElement === filterInput,
      onControl: Boolean(document.activeElement?.closest('button, a')),
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
        if (selected !== undefined) open(selected);
        break;
      case 'open-index': {
        const entry = ordered[action.index];
        if (entry !== undefined) open(entry);
        break;
      }
    }
  }
</script>

<svelte:window {onkeydown} />

<main>
  <!-- Waits for settings too: an empty default stack would otherwise flash the
       first-run or "none apply" state at a returning user. -->
  {#if view.kind === 'loading' || (view.kind === 'repo' && !settingsReady)}
    <p class="status">Detecting repository…</p>
  {:else if view.kind === 'prompt'}
    <RepoPrompt
      message={view.message}
      onresolve={useInput}
      back={detected === null ? undefined : { label: formatRepoRef(detected), onback: goBack }}
    />
  {:else}
    <RepoHeader
      repo={view.repo}
      onchange={() => (view = { kind: 'prompt', message: 'Which repository?' })}
    />

    {#if firstRun}
      <section class="first-run">
        <h2>Build your deck</h2>
        <p>
          Only the tools you pick show up here, pointed at whatever repository you are on. Start
          with the best one from each section, or choose your own from {TOOLS.length}.
        </p>
        <div class="actions">
          <button type="button" class="primary" onclick={useRecommended}>
            Use the recommended deck
          </button>
          <button type="button" class="secondary" onclick={manage}>Choose my own</button>
        </div>
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
          <ToolDeck
            entries={ordered}
            selectedId={selected?.tool.id}
            onopen={open}
            onselect={select}
          />
        {/if}
      </div>
    {/if}

    {#if notice !== null}
      <p class="notice" role="status">{notice}</p>
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

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  .secondary {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .secondary:hover {
    background: var(--bg-hover);
  }

  .primary {
    flex: 1;
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

  .notice {
    margin: 0;
    padding: var(--space-2) var(--space-4);
    overflow: hidden;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
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
