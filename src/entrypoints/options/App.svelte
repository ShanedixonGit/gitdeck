<script lang="ts">
  import { DEFAULT_SETTINGS, OPEN_TARGETS, loadSettings, saveSettings } from '../../lib/settings';
  import type { OpenTarget, Settings } from '../../lib/settings';
  import {
    CATEGORIES,
    TOOLS,
    applyOrder,
    categoryLabel,
    categoryTint,
    moveInOrder,
    reconcileOrder,
  } from '../../lib/tools';
  import type { ToolDefinition } from '../../lib/tools';

  let settings = $state<Settings>(DEFAULT_SETTINGS);
  let ready = $state(false);

  const byId = new Map(TOOLS.map((tool) => [tool.id, tool]));
  const knownIds = TOOLS.map((tool) => tool.id);

  /** The registry in the user's order, which is what every control below acts on. */
  const ordered = $derived(
    applyOrder(
      TOOLS.map((tool) => ({ tool })),
      settings.order,
    ).map((row) => row.tool),
  );

  const sections = $derived(
    CATEGORIES.map((category) => ({
      id: category.id,
      label: categoryLabel(category.id),
      tint: categoryTint(category.id),
      tools: ordered.filter((tool) => tool.category === category.id),
    })).filter((section) => section.tools.length > 0),
  );

  const hiddenCount = $derived(settings.hidden.length);
  const unverifiedCount = TOOLS.filter((tool) => tool.status === 'unverified').length;

  void (async () => {
    const stored = await loadSettings();
    settings = { ...stored, order: reconcileOrder(stored.order, knownIds) };
    ready = true;
  })();

  function update(next: Settings) {
    settings = next;
    void saveSettings(next);
  }

  function toggle(list: readonly string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function sameCategory(one: string, two: string) {
    return byId.get(one)?.category === byId.get(two)?.category;
  }

  function move(id: string, delta: -1 | 1) {
    update({ ...settings, order: moveInOrder(settings.order, id, delta, sameCategory) });
  }

  function position(tool: ToolDefinition) {
    const section = sections.find((each) => each.id === tool.category);
    return {
      index: section?.tools.indexOf(tool) ?? 0,
      last: (section?.tools.length ?? 1) - 1,
    };
  }

  function reset() {
    update({
      ...settings,
      favourites: [],
      hidden: [],
      order: reconcileOrder([], knownIds),
    });
  }
</script>

<main>
  <header>
    <h1>Your deck</h1>
    <p>
      Star what you reach for most, hide what you never use, and put each section in the order you
      want it. The popup follows this page, and the number shortcuts follow the popup.
    </p>
  </header>

  {#if !ready}
    <p class="status">Loading…</p>
  {:else}
    <section class="prefs">
      <h2>Open tools in</h2>
      <div class="targets">
        {#each OPEN_TARGETS as target (target.id)}
          <label class="target" class:on={settings.openTarget === target.id}>
            <input
              type="radio"
              name="open-target"
              checked={settings.openTarget === target.id}
              onchange={() => update({ ...settings, openTarget: target.id as OpenTarget })}
            />
            <span class="target-label">{target.label}</span>
            <span class="target-hint">{target.hint}</span>
          </label>
        {/each}
      </div>
      {#if unverifiedCount > 0}
        <label class="unverified">
          <input
            type="checkbox"
            checked={settings.includeUnverified}
            onchange={(event) =>
              update({ ...settings, includeUnverified: event.currentTarget.checked })}
          />
          Show the {unverifiedCount} tool{unverifiedCount === 1 ? '' : 's'} we could not verify automatically
        </label>
      {/if}
    </section>

    {#each sections as section (section.id)}
      <section class="group" style="--tint: var({section.tint})">
        <h2><span class="dot" aria-hidden="true"></span>{section.label}</h2>
        <ul>
          {#each section.tools as tool (tool.id)}
            {@const spot = position(tool)}
            {@const off = settings.hidden.includes(tool.id)}
            <li class:off>
              <span class="monogram" aria-hidden="true"
                >{tool.icon ?? tool.name.slice(0, 2).toLowerCase()}</span
              >
              <span class="body">
                <a href={tool.website} target="_blank" rel="noreferrer noopener">{tool.name}</a>
                <span class="description">{tool.description}</span>
              </span>
              <span class="controls">
                <button
                  type="button"
                  class="star"
                  class:on={settings.favourites.includes(tool.id)}
                  aria-pressed={settings.favourites.includes(tool.id)}
                  aria-label="Pin {tool.name} to the top of the deck"
                  onclick={() =>
                    update({ ...settings, favourites: toggle(settings.favourites, tool.id) })}
                >
                  {settings.favourites.includes(tool.id) ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  aria-label="Move {tool.name} up"
                  disabled={spot.index === 0}
                  onclick={() => move(tool.id, -1)}>↑</button
                >
                <button
                  type="button"
                  aria-label="Move {tool.name} down"
                  disabled={spot.index === spot.last}
                  onclick={() => move(tool.id, 1)}>↓</button
                >
                <button
                  type="button"
                  class="hide"
                  aria-pressed={off}
                  aria-label={off ? `Show ${tool.name}` : `Hide ${tool.name}`}
                  onclick={() => update({ ...settings, hidden: toggle(settings.hidden, tool.id) })}
                >
                  {off ? 'Show' : 'Hide'}
                </button>
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    <footer>
      <span>
        {TOOLS.length} tools
        {#if hiddenCount > 0}· {hiddenCount} hidden{/if}
      </span>
      <button type="button" onclick={reset}>Reset to defaults</button>
    </footer>
  {/if}
</main>

<style>
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: var(--space-4) var(--space-4) 48px;
  }

  header h1 {
    margin: 0;
    font-size: 20px;
  }

  header p {
    margin: var(--space-2) 0 var(--space-4);
    max-width: 52ch;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .status {
    color: var(--text-muted);
  }

  h2 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-2);
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

  .prefs {
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border);
  }

  .targets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-2);
  }

  .target {
    display: grid;
    gap: 2px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
  }

  .target.on {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 7%, transparent);
  }

  .target input {
    display: none;
  }

  .target-label {
    font-size: 13px;
    font-weight: 600;
  }

  .target-hint {
    font-size: 11px;
    color: var(--text-faint);
  }

  .unverified {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    font-size: 12px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .group {
    margin-bottom: var(--space-4);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 2px;
  }

  li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--radius);
  }

  li:hover {
    background: var(--bg-hover);
    border-color: var(--border);
  }

  li.off {
    opacity: 0.45;
  }

  .monogram {
    flex: none;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--tint) 35%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--tint) 12%, transparent);
    color: var(--tint);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
  }

  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .body a {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    text-decoration: none;
    width: fit-content;
  }

  .body a:hover {
    text-decoration: underline;
  }

  .description {
    font-size: 12px;
    color: var(--text-muted);
  }

  .controls {
    flex: none;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .controls button {
    min-width: 26px;
    height: 26px;
    padding: 0 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .controls button:hover:not(:disabled) {
    background: var(--bg-subtle);
    color: var(--text);
  }

  .controls button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .controls .star.on {
    color: var(--tint-favourites);
    border-color: color-mix(in srgb, var(--tint-favourites) 40%, transparent);
  }

  .controls .hide {
    font-size: 11px;
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
    color: var(--text-faint);
    font-size: 12px;
  }

  footer button {
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  footer button:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
</style>
