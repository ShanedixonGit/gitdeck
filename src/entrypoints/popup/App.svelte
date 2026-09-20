<script lang="ts">
  import RepoHeader from '../../components/RepoHeader.svelte';
  import RepoPrompt from '../../components/RepoPrompt.svelte';
  import ToolDeck from '../../components/ToolDeck.svelte';
  import { getActiveTabUrl, openUrl } from '../../lib/browser/active-tab';
  import { parseGitHubRepo } from '../../lib/github/parse-repo';
  import type { RepoRef } from '../../lib/github/types';
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
  let includeUnverified = $state(false);
  let filterInput = $state<HTMLInputElement | null>(null);

  const statuses = $derived<readonly ToolStatus[]>(
    includeUnverified ? ['verified', 'unverified'] : ['verified'],
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

  function open(url: string) {
    void openUrl(url);
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

    <footer>
      <span>{ordered.length} of {resolution.resolved.length} tools</span>
      <label>
        <input type="checkbox" bind:checked={includeUnverified} />
        Show unverified
      </label>
    </footer>
    {#if unavailable > 0}
      <p class="status muted">{unavailable} tool(s) not available for this page.</p>
    {/if}
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

  .status.muted {
    padding: 0 var(--space-4) var(--space-3);
    font-size: 11px;
    color: var(--text-faint);
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

  footer label {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    cursor: pointer;
  }

  footer input {
    margin: 0;
    accent-color: var(--accent);
  }
</style>
