import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardAnnotations } from '../src/hooks/useBoardAnnotations';
import { ChessSquare } from '../src/types/chess';

describe('Board Annotations (Arrows & Square Highlights)', () => {
  it('should add and toggle square highlights', () => {
    const { result } = renderHook(() => useBoardAnnotations());

    expect(result.current.squareHighlights).toEqual([]);

    // Add highlight on e4
    act(() => {
      result.current.toggleHighlight('e4' as ChessSquare, 'green');
    });

    expect(result.current.squareHighlights.length).toBe(1);
    expect(result.current.squareHighlights[0]).toEqual({ square: 'e4', color: 'green' });

    // Toggle same square and color removes highlight
    act(() => {
      result.current.toggleHighlight('e4' as ChessSquare, 'green');
    });

    expect(result.current.squareHighlights).toEqual([]);
  });

  it('should change square highlight color if different color selected', () => {
    const { result } = renderHook(() => useBoardAnnotations());

    act(() => {
      result.current.toggleHighlight('e4' as ChessSquare, 'green');
    });
    expect(result.current.squareHighlights[0].color).toBe('green');

    act(() => {
      result.current.toggleHighlight('e4' as ChessSquare, 'red');
    });
    expect(result.current.squareHighlights[0].color).toBe('red');
  });

  it('should add, update, and remove directional arrows', () => {
    const { result } = renderHook(() => useBoardAnnotations());

    expect(result.current.arrows).toEqual([]);

    // Add arrow from e2 to e4
    act(() => {
      result.current.toggleArrow('e2' as ChessSquare, 'e4' as ChessSquare, 'green');
    });

    expect(result.current.arrows.length).toBe(1);
    expect(result.current.arrows[0]).toEqual({
      id: 'e2-e4',
      from: 'e2',
      to: 'e4',
      color: 'green',
    });

    // Toggle again with same color removes arrow
    act(() => {
      result.current.toggleArrow('e2' as ChessSquare, 'e4' as ChessSquare, 'green');
    });

    expect(result.current.arrows.length).toBe(0);
  });

  it('should clear all arrows and square highlights on clearAnnotations', () => {
    const { result } = renderHook(() => useBoardAnnotations());

    act(() => {
      result.current.toggleHighlight('e4' as ChessSquare, 'green');
      result.current.toggleHighlight('d4' as ChessSquare, 'red');
      result.current.toggleArrow('g1' as ChessSquare, 'f3' as ChessSquare, 'blue');
    });

    expect(result.current.squareHighlights.length).toBe(2);
    expect(result.current.arrows.length).toBe(1);

    act(() => {
      result.current.clearAnnotations();
    });

    expect(result.current.squareHighlights).toEqual([]);
    expect(result.current.arrows).toEqual([]);
  });
});
