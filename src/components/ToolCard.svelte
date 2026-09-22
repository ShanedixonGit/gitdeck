<script lang="ts">
  import type { ResolvedTool } from '../lib/tools';
  import CategoryIcon from './CategoryIcon.svelte';

  interface Props {
    entry: ResolvedTool;
    selected: boolean;
    shortcut?: number | undefined;
    onopen: (url: string) => void;
  }

  let { entry, selected, shortcut, onopen }: Props = $props();
</script>

<button
  type="button"
  class="card"
  class:selected
  data-tool-id={entry.tool.id}
  title={entry.url}
  onclick={() => onopen(entry.url)}
>
  <CategoryIcon id={entry.tool.category} />
  <span class="body">
    <span class="name">
      {entry.tool.name}
      {#if entry.tool.status === 'unverified'}<span class="badge">unverified</span>{/if}
    </span>
    <span class="brand">{entry.tool.brand}</span>
    {#if entry.tool.notes}<span class="notes">{entry.tool.notes}</span>{/if}
  </span>
  {#if shortcut !== undefined}
    <kbd aria-hidden="true">{shortcut}</kbd>
  {/if}
  <span class="arrow" aria-hidden="true">→</span>
</button>

<style>
  .card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .card:hover,
  .card.selected {
    background: var(--bg-hover);
    border-color: var(--border);
  }

  .card.selected .arrow {
    opacity: 1;
    color: var(--accent);
  }

  .body {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .name {
    font-weight: 600;
    font-size: 13px;
  }

  .badge {
    margin-left: var(--space-1);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--warn);
  }

  .brand {
    color: var(--text-muted);
    font-size: 12px;
  }

  .notes {
    color: var(--text-faint);
    font-size: 11px;
    margin-top: 1px;
  }

  kbd {
    flex: none;
    align-self: center;
    min-width: 16px;
    padding: 1px 4px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-subtle);
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.4;
    text-align: center;
  }

  .card:hover kbd,
  .card.selected kbd {
    color: var(--text-muted);
    border-color: var(--border-strong);
  }

  .arrow {
    flex: none;
    align-self: center;
    color: var(--text-faint);
    opacity: 0;
    transition: opacity 80ms ease;
  }

  .card:hover .arrow {
    opacity: 1;
  }
</style>
