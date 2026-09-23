export interface WriteQueue<T> {
  /** Queues a value, replacing any still waiting to be written. */
  push(value: T): void;
  /** Writes the waiting value now, if there is one. */
  flush(): Promise<void>;
  /** A value is waiting, so what storage holds is about to be replaced. */
  readonly pending: boolean;
}

/**
 * Coalesces a burst of writes into one.
 *
 * `storage.sync` allows about two writes a second, averaged over a minute, and
 * silently refuses the rest. Dragging and nudging tools can produce far more
 * than that, so only the last value of a burst is written, once the burst has
 * been quiet for `delay` milliseconds.
 */
export function createWriteQueue<T>(
  write: (value: T) => Promise<boolean>,
  delay: number,
  onResult: (ok: boolean) => void = () => {},
): WriteQueue<T> {
  let pending: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function flush() {
    clearTimeout(timer);
    if (pending === null) return;
    const { value } = pending;
    pending = null;
    onResult(await write(value));
  }

  return {
    push(value) {
      pending = { value };
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), delay);
    },
    flush,
    get pending() {
      return pending !== null;
    },
  };
}
