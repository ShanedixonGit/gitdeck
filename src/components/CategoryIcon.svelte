<script lang="ts">
  import { category } from '../lib/tools';
  import type { ToolCategory } from '../lib/tools';

  interface Props {
    id: ToolCategory;
    /** Just the glyph, sized to sit in a line of text, without the tinted tile. */
    bare?: boolean;
  }

  let { id, bare = false }: Props = $props();

  const section = $derived(category(id));
</script>

<span class="tile" class:bare style="--tint: var({section.tint})" title={section.label}>
  <svg
    viewBox="0 0 24 24"
    width={bare ? 12 : 14}
    height={bare ? 12 : 14}
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {#each section.icon as d (d)}
      <path {d} />
    {/each}
  </svg>
</span>

<style>
  .tile {
    flex: none;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--tint) 35%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--tint) 12%, transparent);
    color: var(--tint);
  }

  .tile.bare {
    width: auto;
    height: auto;
    border: 0;
    background: none;
  }
</style>
