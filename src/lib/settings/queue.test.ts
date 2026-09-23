import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWriteQueue } from './queue';

describe('createWriteQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('writes only the last value of a burst, once it goes quiet', async () => {
    const write = vi.fn(async () => true);
    const queue = createWriteQueue(write, 300);
    queue.push(1);
    queue.push(2);
    await vi.advanceTimersByTimeAsync(200);
    queue.push(3);
    await vi.advanceTimersByTimeAsync(299);
    expect(write).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith(3);
  });

  it('writes a pending value straight away on flush', async () => {
    const write = vi.fn(async () => true);
    const queue = createWriteQueue(write, 300);
    queue.push('a');
    await queue.flush();
    expect(write).toHaveBeenCalledWith('a');
    await vi.advanceTimersByTimeAsync(1000);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('does nothing on flush when nothing is pending', async () => {
    const write = vi.fn(async () => true);
    await createWriteQueue(write, 300).flush();
    expect(write).not.toHaveBeenCalled();
  });

  it('reports each write result', async () => {
    const results: boolean[] = [];
    const write = vi.fn(async (value: number) => value !== 2);
    const queue = createWriteQueue(write, 300, (ok) => results.push(ok));
    queue.push(1);
    await vi.advanceTimersByTimeAsync(300);
    queue.push(2);
    await vi.advanceTimersByTimeAsync(300);
    expect(results).toEqual([true, false]);
  });
});
