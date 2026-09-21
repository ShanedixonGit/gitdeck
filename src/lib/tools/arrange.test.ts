import { describe, expect, it } from 'vitest';
import { applyHidden, applyOrder, moveInOrder, reconcileOrder } from './arrange';

function entries(...ids: string[]) {
  return ids.map((id) => ({ tool: { id } }));
}

function ids(list: ReadonlyArray<{ tool: { id: string } }>) {
  return list.map((entry) => entry.tool.id);
}

describe('applyOrder', () => {
  it('sorts by the stored order', () => {
    expect(ids(applyOrder(entries('a', 'b', 'c'), ['c', 'a', 'b']))).toEqual(['c', 'a', 'b']);
  });

  it('leaves everything in place for an empty order', () => {
    expect(ids(applyOrder(entries('a', 'b', 'c'), []))).toEqual(['a', 'b', 'c']);
  });

  it('puts unknown tools last, keeping their original order', () => {
    expect(ids(applyOrder(entries('a', 'b', 'c', 'd'), ['d']))).toEqual(['d', 'a', 'b', 'c']);
  });

  it('ignores ids in the order that are not present', () => {
    expect(ids(applyOrder(entries('a', 'b'), ['gone', 'b', 'a']))).toEqual(['b', 'a']);
  });
});

describe('applyHidden', () => {
  it('drops hidden tools', () => {
    expect(ids(applyHidden(entries('a', 'b', 'c'), ['b']))).toEqual(['a', 'c']);
  });

  it('is a no-op when nothing is hidden', () => {
    expect(ids(applyHidden(entries('a', 'b'), []))).toEqual(['a', 'b']);
  });

  it('ignores hidden ids that do not exist', () => {
    expect(ids(applyHidden(entries('a'), ['gone']))).toEqual(['a']);
  });
});

describe('moveInOrder', () => {
  const same = () => true;

  it('swaps with the previous tool', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'b', -1, same)).toEqual(['b', 'a', 'c']);
  });

  it('swaps with the next tool', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'b', 1, same)).toEqual(['a', 'c', 'b']);
  });

  it('does nothing at the top', () => {
    expect(moveInOrder(['a', 'b'], 'a', -1, same)).toEqual(['a', 'b']);
  });

  it('does nothing at the bottom', () => {
    expect(moveInOrder(['a', 'b'], 'b', 1, same)).toEqual(['a', 'b']);
  });

  it('does nothing for an unknown id', () => {
    expect(moveInOrder(['a', 'b'], 'gone', 1, same)).toEqual(['a', 'b']);
  });

  it('steps over tools from another section, so the card moves where it is visible', () => {
    const section: Record<string, string> = { a: 'x', b: 'y', c: 'x' };
    const sameSection = (one: string, two: string) => section[one] === section[two];
    expect(moveInOrder(['a', 'b', 'c'], 'c', -1, sameSection)).toEqual(['c', 'b', 'a']);
  });

  it('does nothing when the tool is the only one in its section', () => {
    const section: Record<string, string> = { a: 'x', b: 'y', c: 'y' };
    const sameSection = (one: string, two: string) => section[one] === section[two];
    expect(moveInOrder(['a', 'b', 'c'], 'a', 1, sameSection)).toEqual(['a', 'b', 'c']);
  });

  it('never mutates the order it was given', () => {
    const order = ['a', 'b'];
    moveInOrder(order, 'a', 1, same);
    expect(order).toEqual(['a', 'b']);
  });
});

describe('reconcileOrder', () => {
  it('appends tools added to the registry since the user arranged the deck', () => {
    expect(reconcileOrder(['b', 'a'], ['a', 'b', 'c'])).toEqual(['b', 'a', 'c']);
  });

  it('drops tools that no longer exist', () => {
    expect(reconcileOrder(['gone', 'a'], ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('drops duplicates', () => {
    expect(reconcileOrder(['a', 'a', 'b'], ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('names every known tool exactly once', () => {
    const result = reconcileOrder([], ['a', 'b', 'c']);
    expect(result).toEqual(['a', 'b', 'c']);
    expect(new Set(result).size).toBe(result.length);
  });
});
