<script lang="ts">
  import type { ResolvedTool, ToolGroup } from '../lib/tools';
  import ToolCard from './ToolCard.svelte';

  interface Props {
    groups: readonly ToolGroup[];
    ordered: readonly ResolvedTool[];
    selectedId: string | undefined;
    onopen: (url: string) => void;
  }

  let { groups, ordered, selectedId, onopen }: Props = $props();

  function shortcut(entry: ResolvedTool): number | undefined {
    const position = ordered.indexOf(entry);
    return position >= 0 && position < 9 ? position + 1 : undefined;
  }
</script>

{#each groups as group (group.category)}
  <section>
    <h2>{group.label}</h2>
    {#each group.entries as entry (entry.tool.id)}
      <ToolCard
        {entry}
        selected={entry.tool.id === selectedId}
        shortcut={shortcut(entry)}
        {onopen}
      />
    {/each}
  </section>
{/each}

<style>
  section {
    padding: 0 var(--space-3) var(--space-2);
  }

  h2 {
    margin: var(--space-2) 0 var(--space-1);
    padding: 0 var(--space-3);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
</style>
