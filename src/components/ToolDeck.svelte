<script lang="ts">
  import type { ResolvedTool } from '../lib/tools';
  import ToolCard from './ToolCard.svelte';

  interface Props {
    entries: readonly ResolvedTool[];
    selectedId: string | undefined;
    onopen: (entry: ResolvedTool) => void;
    onselect: (entry: ResolvedTool) => void;
  }

  let { entries, selectedId, onopen, onselect }: Props = $props();
</script>

<ul>
  {#each entries as entry, index (entry.tool.id)}
    <li>
      <ToolCard
        {entry}
        selected={entry.tool.id === selectedId}
        shortcut={index < 9 ? index + 1 : undefined}
        {onopen}
        {onselect}
      />
    </li>
  {/each}
</ul>

<style>
  ul {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    list-style: none;
  }
</style>
