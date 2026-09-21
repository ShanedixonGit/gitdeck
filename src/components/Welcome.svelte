<script lang="ts">
  interface Props {
    toolCount: number;
    onmanage: () => void;
    ondismiss: () => void;
  }

  let { toolCount, onmanage, ondismiss }: Props = $props();
</script>

<section class="welcome">
  <h2>{toolCount} tools, pointed at whatever repo you are on</h2>
  <ul>
    <li><kbd>1</kbd>–<kbd>9</kbd> opens a tool straight away</li>
    <li>
      <span class="star" aria-hidden="true">☆</span> pins one to the top, so it keeps a low number
    </li>
    <li><kbd>/</kbd> filters, <kbd>↑</kbd><kbd>↓</kbd> moves, <kbd>Enter</kbd> opens</li>
  </ul>
  <div class="actions">
    <button type="button" class="primary" onclick={ondismiss}>Show me the deck</button>
    <button type="button" onclick={onmanage}>Customise it first</button>
  </div>
</section>

<style>
  .welcome {
    padding: var(--space-3) var(--space-4) var(--space-4);
  }

  h2 {
    margin: 0 0 var(--space-3);
    font-size: 13px;
    font-weight: 600;
  }

  ul {
    margin: 0 0 var(--space-4);
    padding: 0;
    list-style: none;
    display: grid;
    gap: var(--space-2);
    font-size: 12px;
    color: var(--text-muted);
  }

  .star {
    color: var(--tint-favourites);
  }

  kbd {
    display: inline-block;
    min-width: 14px;
    padding: 1px 4px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-subtle);
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 10px;
    text-align: center;
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  .actions button {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .actions button:hover {
    background: var(--bg-hover);
  }

  .actions .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-contrast);
  }

  .actions .primary:hover {
    opacity: 0.9;
    background: var(--accent);
  }
</style>
