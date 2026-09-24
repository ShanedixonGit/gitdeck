<script lang="ts">
  import {
    DEFAULT_SETTINGS,
    OPEN_TARGETS,
    createWriteQueue,
    loadSettings,
    saveSettings,
    watchSettings,
  } from '../../lib/settings';
  import type { OpenTarget, Settings } from '../../lib/settings';
  import {
    CATEGORIES,
    TOOLS,
    nudgeInStack,
    placeInStack,
    recommendedStack,
    reconcileStack,
    removeFromStack,
  } from '../../lib/tools';
  import CategoryIcon from '../../components/CategoryIcon.svelte';

  type Panel = 'available' | 'stack';

  let settings = $state<Settings>(DEFAULT_SETTINGS);
  let ready = $state(false);
  let saveFailed = $state(false);
  let dragging = $state<{ id: string; from: Panel } | null>(null);
  let over = $state<Panel | null>(null);
  /** Where a drop on the stack would land: before this id, or at the end for `null`. */
  let dropBefore = $state<string | null>(null);

  const byId = new Map(TOOLS.map((tool) => [tool.id, tool]));
  const knownIds = TOOLS.map((tool) => tool.id);
  const unverifiedCount = TOOLS.filter((tool) => tool.status === 'unverified').length;

  const stackTools = $derived(
    settings.stack.flatMap((id) => {
      const tool = byId.get(id);
      return tool === undefined ? [] : [tool];
    }),
  );

  const available = $derived(
    CATEGORIES.map((category) => ({
      ...category,
      tools: TOOLS.filter(
        (tool) =>
          tool.category === category.id &&
          !settings.stack.includes(tool.id) &&
          (tool.status === 'verified' ||
            (tool.status === 'unverified' && settings.includeUnverified)),
      ),
    })).filter((section) => section.tools.length > 0),
  );

  void (async () => {
    const stored = await loadSettings();
    settings = { ...stored, stack: reconcileStack(stored.stack, knownIds) };
    ready = true;
  })();

  const queue = createWriteQueue(saveSettings, 400, (ok) => (saveFailed = !ok));

  function update(next: Settings) {
    settings = next;
    queue.push(next);
  }

  function flushOnHide() {
    if (document.visibilityState === 'hidden') void queue.flush();
  }

  /** The deck before "Reset" or "Empty", which replace it wholesale. */
  let undo = $state<{ message: string; stack: readonly string[] } | null>(null);

  /**
   * Follows changes made elsewhere, such as the popup's recommended deck. A
   * change of this page's own still waiting to be written wins, since it is
   * newer than anything storage holds.
   */
  $effect(() =>
    watchSettings((next) => {
      if (queue.pending) return;
      settings = { ...next, stack: reconcileStack(next.stack, knownIds) };
      undo = null;
    }),
  );

  function setStack(stack: string[]) {
    undo = null;
    update({ ...settings, stack });
  }

  function replaceStack(stack: string[], message: string) {
    const previous = settings.stack;
    setStack(stack);
    undo = { message, stack: previous };
  }

  function restore() {
    if (undo !== null) setStack([...undo.stack]);
  }

  function startDrag(event: DragEvent, id: string, from: Panel) {
    dragging = { id, from };
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  function endDrag() {
    dragging = null;
    over = null;
    dropBefore = null;
  }

  function overPanel(event: DragEvent, panel: Panel) {
    if (dragging === null) return;
    event.preventDefault();
    over = panel;
  }

  function overStackItem(event: DragEvent, index: number) {
    if (dragging === null) return;
    event.preventDefault();
    event.stopPropagation();
    over = 'stack';
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const below = event.clientY > rect.top + rect.height / 2;
    dropBefore = below ? (settings.stack[index + 1] ?? null) : (settings.stack[index] ?? null);
  }

  function overStackEnd(event: DragEvent) {
    overPanel(event, 'stack');
    dropBefore = null;
  }

  function dropOnStack(event: DragEvent) {
    event.preventDefault();
    if (dragging !== null) setStack(placeInStack(settings.stack, dragging.id, dropBefore));
    endDrag();
  }

  function dropOnAvailable(event: DragEvent) {
    event.preventDefault();
    if (dragging?.from === 'stack') setStack(removeFromStack(settings.stack, dragging.id));
    endDrag();
  }

  function nudge(event: KeyboardEvent, id: string) {
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    setStack(nudgeInStack(settings.stack, id, delta));
    queueMicrotask(() => document.querySelector<HTMLElement>(`[data-handle="${id}"]`)?.focus());
  }
</script>

<svelte:document onvisibilitychange={flushOnHide} />
<svelte:window onpagehide={() => void queue.flush()} />

<main>
  <header>
    <h1>Your deck</h1>
    <p>
      The popup shows only the tools in your deck, in this order, pointed at whatever repository you
      are on. Drag tools across to add or remove them, and drag within your deck to reorder.
    </p>
  </header>

  {#if saveFailed}
    <p class="save-error" role="alert">
      The browser would not save your last change. It will be lost when this page closes.
    </p>
  {/if}

  {#if !ready}
    <p class="status">Loading…</p>
  {:else}
    <div class="panels">
      <section
        class="panel"
        class:target={over === 'available' && dragging?.from === 'stack'}
        aria-labelledby="available-heading"
        ondragover={(event) => overPanel(event, 'available')}
        ondrop={dropOnAvailable}
      >
        <h2 id="available-heading">Available</h2>
        {#each available as section (section.id)}
          <h3><CategoryIcon id={section.id} bare />{section.label}</h3>
          <ul>
            {#each section.tools as tool (tool.id)}
              <li
                draggable="true"
                class:lifted={dragging?.id === tool.id}
                ondragstart={(event) => startDrag(event, tool.id, 'available')}
                ondragend={endDrag}
              >
                <CategoryIcon id={tool.category} />
                <span class="body">
                  <span class="name">
                    {tool.name}
                    {#if tool.status === 'unverified'}<span class="badge">unverified</span>{/if}
                  </span>
                  <span class="description">{tool.description}</span>
                  <a href={tool.website} target="_blank" rel="noreferrer noopener">{tool.brand}</a>
                </span>
                <button
                  type="button"
                  class="icon"
                  aria-label="Add {tool.name} to your deck"
                  title="Add to your deck"
                  onclick={() => setStack(placeInStack(settings.stack, tool.id))}>+</button
                >
              </li>
            {/each}
          </ul>
        {:else}
          <p class="hint">Every tool is in your deck.</p>
        {/each}
      </section>

      <section
        class="panel stack"
        class:target={over === 'stack'}
        aria-labelledby="stack-heading"
        ondragover={overStackEnd}
        ondrop={dropOnStack}
      >
        <h2 id="stack-heading">
          In your deck <span class="count">{stackTools.length}</span>
        </h2>
        {#if stackTools.length === 0}
          <div class="welcome">
            <p class="lead">Your deck is empty.</p>
            <p>
              <button
                type="button"
                class="recommend"
                onclick={() => setStack(recommendedStack(TOOLS))}
              >
                Use the recommended deck
              </button>
            </p>
            <p>
              The best tool from each section. Or drag your own here, or press <kbd>+</kbd> beside one.
            </p>
            <p>Then, from the popup:</p>
            <ul class="keys">
              <li><kbd>1</kbd>–<kbd>9</kbd> opens a tool straight away</li>
              <li><kbd>/</kbd> filters, <kbd>↑</kbd><kbd>↓</kbd> moves, <kbd>Enter</kbd> opens</li>
            </ul>
          </div>
        {:else}
          <ol class:drop-end={over === 'stack' && dropBefore === null}>
            {#each stackTools as tool, index (tool.id)}
              <li
                draggable="true"
                class:lifted={dragging?.id === tool.id}
                class:drop-before={over === 'stack' && dropBefore === tool.id}
                ondragstart={(event) => startDrag(event, tool.id, 'stack')}
                ondragend={endDrag}
                ondragover={(event) => overStackItem(event, index)}
              >
                <button
                  type="button"
                  class="handle"
                  data-handle={tool.id}
                  aria-label="Move {tool.name}, position {index +
                    1}. Use the up and down arrow keys."
                  title="Drag, or use the arrow keys"
                  onkeydown={(event) => nudge(event, tool.id)}>⠿</button
                >
                <CategoryIcon id={tool.category} />
                <span class="body">
                  <span class="name">{tool.name}</span>
                  <span class="description">{tool.brand}</span>
                </span>
                {#if index < 9}<kbd aria-hidden="true">{index + 1}</kbd>{/if}
                <button
                  type="button"
                  class="icon"
                  aria-label="Remove {tool.name} from your deck"
                  title="Remove from your deck"
                  onclick={() => setStack(removeFromStack(settings.stack, tool.id))}>×</button
                >
              </li>
            {/each}
          </ol>
        {/if}
      </section>
    </div>

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
          Offer the {unverifiedCount} tool{unverifiedCount === 1 ? '' : 's'} we could not verify automatically
        </label>
      {/if}
    </section>

    {#if stackTools.length > 0 || undo !== null}
      <footer>
        {#if stackTools.length > 0}
          <button
            type="button"
            onclick={() => replaceStack(recommendedStack(TOOLS), 'Reset to the recommended deck.')}
          >
            Reset to the recommended deck
          </button>
          <button type="button" onclick={() => replaceStack([], 'Your deck is empty.')}>
            Empty your deck
          </button>
        {/if}
        {#if undo !== null}
          <p class="undo" role="status">
            {undo.message}
            <button type="button" onclick={restore}>Undo</button>
          </p>
        {/if}
      </footer>
    {/if}
  {/if}
</main>

<style>
  .save-error {
    margin: 0 0 var(--space-4);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--warn);
    border-radius: var(--radius-sm);
    color: var(--warn);
  }

  main {
    max-width: 960px;
    margin: 0 auto;
    padding: var(--space-4) var(--space-4) 48px;
  }

  header h1 {
    margin: 0;
    font-size: 20px;
  }

  header p {
    margin: var(--space-2) 0 var(--space-4);
    max-width: 60ch;
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
    margin: 0 0 var(--space-3);
    font-size: 13px;
    font-weight: 600;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-3) 0 var(--space-1);
    padding: 0 var(--space-2);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  .count {
    padding: 0 6px;
    border-radius: 999px;
    background: var(--bg-hover);
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 500;
  }

  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    align-items: start;
  }

  @media (max-width: 720px) {
    .panels {
      grid-template-columns: 1fr;
    }
  }

  .panel {
    min-height: 240px;
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-subtle);
    transition: border-color 80ms ease;
  }

  .panel.target {
    border-color: var(--accent);
  }

  .stack {
    position: sticky;
    top: var(--space-4);
    background: var(--bg);
  }

  ul,
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 2px;
  }

  li {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: var(--bg);
    cursor: grab;
  }

  li:hover {
    border-color: var(--border);
  }

  li.lifted {
    opacity: 0.4;
  }

  li.drop-before::before,
  ol.drop-end::after {
    content: '';
    height: 2px;
    border-radius: 1px;
    background: var(--accent);
  }

  li.drop-before::before {
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
  }

  /* The drop line is a background, which high-contrast modes would remove. */
  @media (forced-colors: active) {
    li.drop-before::before,
    ol.drop-end::after {
      forced-color-adjust: none;
      background: Highlight;
    }
  }

  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .name {
    font-size: 13px;
    font-weight: 600;
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
    font-size: 12px;
    color: var(--text-muted);
  }

  .body a {
    width: fit-content;
    font-size: 11px;
    color: var(--text-faint);
    text-decoration: none;
  }

  .body a:hover {
    color: var(--text-muted);
    text-decoration: underline;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .icon {
    flex: none;
    width: 26px;
    height: 26px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1;
  }

  .icon:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .handle {
    flex: none;
    width: 18px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-faint);
    font-size: 14px;
    cursor: grab;
  }

  .handle:hover {
    color: var(--text);
  }

  kbd {
    flex: none;
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

  .welcome {
    display: grid;
    place-content: center;
    min-height: 180px;
    padding: var(--space-4);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
  }

  .welcome p {
    margin: 0 0 var(--space-2);
  }

  .welcome .lead {
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
  }

  .keys {
    gap: var(--space-1);
    justify-items: center;
  }

  .keys li {
    display: block;
    padding: 0;
    background: none;
    cursor: default;
  }

  .hint {
    margin: 0;
    color: var(--text-faint);
    font-size: 12px;
  }

  .prefs {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border);
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

  .recommend {
    padding: 6px 12px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: var(--accent-contrast);
    font-size: 12px;
  }

  .recommend:hover {
    opacity: 0.9;
  }

  footer {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }

  footer button {
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
  }

  footer button:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .undo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 0 auto;
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
