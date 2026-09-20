<script lang="ts">
  import { parseGitHubRepo } from '../lib/github/parse-repo';

  interface Props {
    message: string;
    onresolve: (input: string) => void;
  }

  let { message, onresolve }: Props = $props();

  let value = $state('');
  const parsed = $derived(value.trim() === '' ? null : parseGitHubRepo(value));
  const valid = $derived(value.trim() === '' || parsed !== null);

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (parsed !== null) onresolve(value);
  }
</script>

<div class="prompt">
  <p class="message">{message}</p>
  <form onsubmit={submit}>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="text"
      bind:value
      autofocus
      spellcheck="false"
      autocomplete="off"
      placeholder="github.com/owner/repository"
      aria-label="GitHub repository URL"
      aria-invalid={!valid}
    />
    <button type="submit" disabled={parsed === null}>Use</button>
  </form>
  {#if !valid}
    <p class="error">That is not a GitHub repository URL.</p>
  {/if}
</div>

<style>
  .prompt {
    padding: var(--space-4);
  }

  .message {
    margin: 0 0 var(--space-3);
    color: var(--text-muted);
  }

  form {
    display: flex;
    gap: var(--space-2);
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg-subtle);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
  }

  input[aria-invalid='true'] {
    border-color: var(--warn);
  }

  button {
    flex: none;
    padding: 6px 12px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: var(--accent-contrast);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  button:disabled {
    background: var(--bg-hover);
    color: var(--text-faint);
    cursor: default;
  }

  .error {
    margin: var(--space-2) 0 0;
    color: var(--warn);
    font-size: 12px;
  }
</style>
