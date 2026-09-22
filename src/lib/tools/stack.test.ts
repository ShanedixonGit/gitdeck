import { describe, expect, it } from 'vitest';
import {
  nudgeInStack,
  pickStack,
  placeInStack,
  recommendedStack,
  reconcileStack,
  removeFromStack,
} from './stack';

function entries(...ids: string[]) {
  return ids.map((id) => ({ tool: { id } }));
}

function ids(list: ReadonlyArray<{ tool: { id: string } }>) {
  return list.map((entry) => entry.tool.id);
}

describe('pickStack', () => {
  it('keeps only the chosen tools', () => {
    expect(ids(pickStack(entries('a', 'b', 'c'), ['b']))).toEqual(['b']);
  });

  it('follows the stack order, not the registry order', () => {
    expect(ids(pickStack(entries('a', 'b', 'c'), ['c', 'a']))).toEqual(['c', 'a']);
  });

  it('is empty for an empty stack', () => {
    expect(pickStack(entries('a', 'b'), [])).toEqual([]);
  });

  it('ignores chosen tools that are not available', () => {
    expect(ids(pickStack(entries('a'), ['gone', 'a']))).toEqual(['a']);
  });
});

describe('placeInStack', () => {
  it('appends a new tool by default', () => {
    expect(placeInStack(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('inserts a new tool before a neighbour', () => {
    expect(placeInStack(['a', 'c'], 'b', 'c')).toEqual(['a', 'b', 'c']);
  });

  it('moves a tool up without duplicating it', () => {
    expect(placeInStack(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
  });

  it('moves a tool down without duplicating it', () => {
    expect(placeInStack(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'a', 'c']);
  });

  it('moves a tool to the end', () => {
    expect(placeInStack(['a', 'b', 'c'], 'a', null)).toEqual(['b', 'c', 'a']);
  });

  it('appends when the neighbour is not in the stack', () => {
    expect(placeInStack(['a'], 'b', 'gone')).toEqual(['a', 'b']);
  });

  it('does nothing when dropped onto itself', () => {
    expect(placeInStack(['a', 'b'], 'a', 'a')).toEqual(['a', 'b']);
  });

  it('never mutates the stack it was given', () => {
    const stack = ['a', 'b'];
    placeInStack(stack, 'b', 'a');
    expect(stack).toEqual(['a', 'b']);
  });
});

describe('removeFromStack', () => {
  it('drops the tool', () => {
    expect(removeFromStack(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('is a no-op for a tool not in the stack', () => {
    expect(removeFromStack(['a'], 'gone')).toEqual(['a']);
  });
});

describe('nudgeInStack', () => {
  it('swaps with the previous tool', () => {
    expect(nudgeInStack(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
  });

  it('swaps with the next tool', () => {
    expect(nudgeInStack(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('does nothing at either end', () => {
    expect(nudgeInStack(['a', 'b'], 'a', -1)).toEqual(['a', 'b']);
    expect(nudgeInStack(['a', 'b'], 'b', 1)).toEqual(['a', 'b']);
  });

  it('does nothing for a tool not in the stack', () => {
    expect(nudgeInStack(['a', 'b'], 'gone', 1)).toEqual(['a', 'b']);
  });
});

describe('reconcileStack', () => {
  it('drops tools the registry no longer has', () => {
    expect(reconcileStack(['gone', 'a'], ['a', 'b'])).toEqual(['a']);
  });

  it('does not add tools the user never chose', () => {
    expect(reconcileStack(['b'], ['a', 'b', 'c'])).toEqual(['b']);
  });

  it('drops duplicates, keeping the first', () => {
    expect(reconcileStack(['b', 'a', 'b'], ['a', 'b'])).toEqual(['b', 'a']);
  });
});

describe('recommendedStack', () => {
  const tool = (id: string, category: 'ide' | 'search', extra = {}) => ({
    id,
    category,
    status: 'verified' as const,
    ...extra,
  });

  it('takes only recommended tools, in section order', () => {
    expect(
      recommendedStack([
        tool('s', 'search', { recommended: true }),
        tool('i', 'ide'),
        tool('e', 'ide', { recommended: true }),
      ]),
    ).toEqual(['e', 's']);
  });

  it('never recommends a tool that is not verified', () => {
    expect(
      recommendedStack([tool('e', 'ide', { recommended: true, status: 'unverified' })]),
    ).toEqual([]);
  });
});
