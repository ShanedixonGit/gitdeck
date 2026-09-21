<script lang="ts">
  import type { ResolvedTool, ToolGroup } from '../lib/tools';
  import ToolCard from './ToolCard.svelte';

  interface Props {
    groups: readonly ToolGroup[];
    ordered: readonly ResolvedTool[];
    selectedId: string | undefined;
    favourites: readonly string[];
    onopen: (url: string) => void;
    onfavourite: (id: string) => void;
  }

  let { groups, ordered, selectedId, favourites, onopen, onfavourite }: Props = $props();

  function shortcut(entry: ResolvedTool): number | undefined {
    const position = ordered.indexOf(entry);
    return position >= 0 && position < 9 ? position + 1 : undefined;
  }
</script>

{#each groups as group (group.id)}
  <section>
    <h2 style="--tint: var({group.tint})">
      <span class="dot" aria-hidden="true"></span>
      {group.label}
    </h2>
    {#each group.entries as entry (entry.tool.id)}
      <ToolCard
        {entry}
        selected={entry.tool.id === selectedId}
        shortcut={shortcut(entry)}
        tint={group.tint}
        favourite={favourites.includes(entry.tool.id)}
        {onopen}
        {onfavourite}
      />
    {/each}
  </section>
{/each}

<style>
  section {
    padding: 0 var(--space-3) var(--space-2);
  }

  h2 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-2) 0 var(--space-1);
    padding: 0 var(--space-3);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--tint);
  }
</style>
