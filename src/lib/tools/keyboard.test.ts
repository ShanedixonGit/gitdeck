import { describe, expect, it } from 'vitest';
import { keyAction } from './keyboard';
import type { KeyContext } from './keyboard';

function context(overrides: Partial<KeyContext> = {}): KeyContext {
  return {
    key: 'a',
    modified: false,
    typing: false,
    onControl: false,
    filterEmpty: true,
    hasResults: true,
    ...overrides,
  };
}

describe('keyAction', () => {
  it('ignores unknown keys', () => {
    expect(keyAction(context({ key: 'q' }))).toEqual({ type: 'none' });
  });

  it('never intercepts a modified keypress', () => {
    for (const key of ['/', 'Escape', 'ArrowDown', 'Enter', '1']) {
      expect(keyAction(context({ key, modified: true, filterEmpty: false }))).toEqual({
        type: 'none',
      });
    }
  });

  describe('a focused button or link', () => {
    it('keeps Enter, so it activates what has focus', () => {
      expect(keyAction(context({ key: 'Enter', onControl: true }))).toEqual({ type: 'none' });
    });

    it('still moves the selection with the arrow keys', () => {
      expect(keyAction(context({ key: 'ArrowDown', onControl: true }))).toEqual({
        type: 'move',
        delta: 1,
      });
    });
  });

  describe('filter', () => {
    it('focuses the filter on slash', () => {
      expect(keyAction(context({ key: '/' }))).toEqual({ type: 'focus-filter' });
    });

    it('lets slash type normally while already in the filter', () => {
      expect(keyAction(context({ key: '/', typing: true }))).toEqual({ type: 'none' });
    });

    it('clears a non-empty filter on escape', () => {
      expect(keyAction(context({ key: 'Escape', filterEmpty: false }))).toEqual({
        type: 'clear-filter',
      });
    });

    it('does nothing on escape when the filter is already empty', () => {
      expect(keyAction(context({ key: 'Escape' }))).toEqual({ type: 'none' });
    });
  });

  describe('navigation', () => {
    it('moves down', () => {
      expect(keyAction(context({ key: 'ArrowDown' }))).toEqual({ type: 'move', delta: 1 });
    });

    it('moves up', () => {
      expect(keyAction(context({ key: 'ArrowUp' }))).toEqual({ type: 'move', delta: -1 });
    });

    it('still navigates while typing in the filter', () => {
      expect(keyAction(context({ key: 'ArrowDown', typing: true }))).toEqual({
        type: 'move',
        delta: 1,
      });
    });

    it('does not move when the deck is empty', () => {
      expect(keyAction(context({ key: 'ArrowDown', hasResults: false }))).toEqual({ type: 'none' });
    });
  });

  describe('opening', () => {
    it('opens the selection on enter', () => {
      expect(keyAction(context({ key: 'Enter' }))).toEqual({ type: 'open-selected' });
    });

    it('opens the selection on enter while typing in the filter', () => {
      expect(keyAction(context({ key: 'Enter', typing: true }))).toEqual({ type: 'open-selected' });
    });

    it('does nothing on enter when the deck is empty', () => {
      expect(keyAction(context({ key: 'Enter', hasResults: false }))).toEqual({ type: 'none' });
    });

    it.each([
      ['1', 0],
      ['5', 4],
      ['9', 8],
    ])('opens position %s by number', (key, index) => {
      expect(keyAction(context({ key }))).toEqual({ type: 'open-index', index });
    });

    it('does not treat zero as a shortcut', () => {
      expect(keyAction(context({ key: '0' }))).toEqual({ type: 'none' });
    });

    it('lets digits type normally in the filter', () => {
      expect(keyAction(context({ key: '3', typing: true }))).toEqual({ type: 'none' });
    });
  });
});
