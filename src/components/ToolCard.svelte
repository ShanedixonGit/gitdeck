<script lang="ts">
  import type { ResolvedTool } from '../lib/tools';

  interface Props {
    entry: ResolvedTool;
    selected: boolean;
    onopen: (url: string) => void;
  }

  let { entry, selected, onopen }: Props = $props();

  const monogram = $derived(entry.tool.icon ?? entry.tool.name.slice(0, 2).toLowerCase());
</script>

<button
  type="button"
  class="card"
  class:selected
  data-tool-id={entry.tool.id}
  title={entry.url}
  onclick={() => onopen(entry.url)}
>
  <span class="monogram" aria-hidden="true">{monogram}</span>
  <span class="body">
    <span class="name">
      {entry.tool.name}
      {#if entry.tool.status === 'unverified'}<span class="badge">unverified</span>{/if}
    </span>
    <span class="description">{entry.tool.description}</span>
    {#if entry.tool.notes}<span class="notes">{entry.tool.notes}</span>{/if}
  </span>
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

  .monogram {
    flex: none;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg-subtle);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: lowercase;
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

  .description {
    color: var(--text-muted);
    font-size: 12px;
  }

  .notes {
    color: var(--text-faint);
    font-size: 11px;
    margin-top: 1px;
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
