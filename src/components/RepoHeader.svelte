<script lang="ts">
  import type { RepoRef } from '../lib/github/types';

  interface Props {
    repo: RepoRef;
    onchange: () => void;
  }

  let { repo, onchange }: Props = $props();
</script>

<header>
  <div class="identity">
    <span class="label">Repository</span>
    <h1><span class="owner">{repo.owner}</span><span class="slash">/</span>{repo.repo}</h1>
    {#if repo.ref}
      <p class="context">
        {repo.ref}{#if repo.path}<span class="slash"> · </span>{repo.path}{/if}
      </p>
    {/if}
  </div>
  <button type="button" class="change" onclick={onchange}>Change</button>
</header>

<style>
  header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4) var(--space-2);
  }

  .identity {
    min-width: 0;
    flex: 1;
  }

  .label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-faint);
  }

  h1 {
    margin: 2px 0 0;
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .owner {
    color: var(--text-muted);
    font-weight: 500;
  }

  .slash {
    color: var(--text-faint);
  }

  .context {
    margin: 2px 0 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .change {
    flex: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 11px;
    padding: 3px 8px;
    cursor: pointer;
  }

  .change:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
</style>
