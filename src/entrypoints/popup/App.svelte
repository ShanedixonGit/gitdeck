<script lang="ts">
  import RepoHeader from '../../components/RepoHeader.svelte';
  import RepoPrompt from '../../components/RepoPrompt.svelte';
  import ToolDeck from '../../components/ToolDeck.svelte';
  import { getActiveTabUrl, openUrl } from '../../lib/browser/active-tab';
  import { parseGitHubRepo } from '../../lib/github/parse-repo';
  import type { RepoRef } from '../../lib/github/types';
  import { TOOLS, filterTools, resolveTools } from '../../lib/tools';
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

  const selected = $derived(visible[Math.min(selectedIndex, visible.length - 1)]);
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
    const id = visible[selectedIndex]?.tool.id;
    if (id === undefined) return;
    queueMicrotask(() => {
      document.querySelector(`[data-tool-id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
    });
  }

  function onkeydown(event: KeyboardEvent) {
    if (view.kind !== 'repo') return;

    if (event.key === '/' && document.activeElement !== filterInput) {
      event.preventDefault();
      filterInput?.focus();
      return;
    }
    if (event.key === 'Escape') {
      if (filter !== '') {
        event.preventDefault();
        filter = '';
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (visible.length === 0) return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      selectedIndex = (selectedIndex + step + visible.length) % visible.length;
      scrollSelectedIntoView();
      return;
    }
    if (event.key === 'Enter' && selected !== undefined) {
      event.preventDefault();
      open(selected.url);
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
      {#if visible.length === 0}
        <p class="status">No tool matches “{filter}”.</p>
      {:else}
        <ToolDeck entries={visible} selectedId={selected?.tool.id} onopen={open} />
      {/if}
    </div>

    <footer>
      <span>{visible.length} of {resolution.resolved.length} tools</span>
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
