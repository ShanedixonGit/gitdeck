<script lang="ts">
  import type { ResolvedTool } from '../lib/tools';
  import { CATEGORIES, categoryLabel } from '../lib/tools';
  import ToolCard from './ToolCard.svelte';

  interface Props {
    entries: readonly ResolvedTool[];
    selectedId: string | undefined;
    onopen: (url: string) => void;
  }

  let { entries, selectedId, onopen }: Props = $props();

  const groups = $derived(
    CATEGORIES.map((category) => ({
      label: categoryLabel(category.id),
      entries: entries.filter((entry) => entry.tool.category === category.id),
    })).filter((group) => group.entries.length > 0),
  );
</script>

{#each groups as group (group.label)}
  <section>
    <h2>{group.label}</h2>
    {#each group.entries as entry (entry.tool.id)}
      <ToolCard {entry} selected={entry.tool.id === selectedId} {onopen} />
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
