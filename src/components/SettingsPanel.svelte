<script lang="ts">
  import { OPEN_TARGETS } from '../lib/settings';
  import type { OpenTarget, Settings } from '../lib/settings';

  interface Props {
    settings: Settings;
    onchange: (settings: Settings) => void;
    onclose: () => void;
    onmanage: () => void;
  }

  let { settings, onchange, onclose, onmanage }: Props = $props();

  function setTarget(openTarget: OpenTarget) {
    onchange({ ...settings, openTarget });
  }
</script>

<section class="panel" aria-label="Settings">
  <header>
    <h2>Settings</h2>
    <button type="button" class="close" onclick={onclose} aria-label="Close settings">Done</button>
  </header>

  <fieldset>
    <legend>Open tools in</legend>
    {#each OPEN_TARGETS as target (target.id)}
      <label class="choice">
        <input
          type="radio"
          name="open-target"
          value={target.id}
          checked={settings.openTarget === target.id}
          onchange={() => setTarget(target.id)}
        />
        <span class="choice-text">
          <span class="choice-label">{target.label}</span>
          <span class="choice-hint">{target.hint}</span>
        </span>
      </label>
    {/each}
  </fieldset>

  <button type="button" class="manage" onclick={onmanage}>
    <span class="choice-text">
      <span class="choice-label">Customise the deck</span>
      <span class="choice-hint">Favourites, order and what to hide, on a full page.</span>
    </span>
    <span aria-hidden="true">→</span>
  </button>
</section>

<style>
  .panel {
    padding: var(--space-3) var(--space-4) var(--space-4);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  h2 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
  }

  .close {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 11px;
    padding: 3px 8px;
    cursor: pointer;
  }

  .close:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  fieldset {
    margin: 0 0 var(--space-3);
    padding: 0;
    border: 0;
  }

  legend {
    padding: 0;
    margin-bottom: var(--space-2);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  .choice,
  .manage {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .choice:hover,
  .manage:hover {
    background: var(--bg-hover);
  }

  .manage {
    width: 100%;
    align-items: center;
    justify-content: space-between;
    border: 0;
    border-top: 1px solid var(--border);
    border-radius: 0;
    padding-top: var(--space-3);
    background: transparent;
    color: var(--text);
    font: inherit;
    text-align: left;
  }

  input {
    margin: 2px 0 0;
    accent-color: var(--accent);
    flex: none;
  }

  .choice-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .choice-label {
    font-size: 12px;
    color: var(--text);
  }

  .choice-hint {
    font-size: 11px;
    color: var(--text-faint);
  }
</style>
