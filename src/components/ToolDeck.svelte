<script lang="ts">
  import { categoryTint } from '../lib/tools';
  import type { ResolvedTool } from '../lib/tools';
  import ToolCard from './ToolCard.svelte';

  interface Props {
    entries: readonly ResolvedTool[];
    selectedId: string | undefined;
    onopen: (url: string) => void;
  }

  let { entries, selectedId, onopen }: Props = $props();
</script>

<ul>
  {#each entries as entry, index (entry.tool.id)}
    <li>
      <ToolCard
        {entry}
        selected={entry.tool.id === selectedId}
        shortcut={index < 9 ? index + 1 : undefined}
        tint={categoryTint(entry.tool.category)}
        {onopen}
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
