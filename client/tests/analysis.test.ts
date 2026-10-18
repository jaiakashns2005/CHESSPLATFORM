import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalysisBoard } from '../src/hooks/useAnalysisBoard';
import { ChessSquare, MoveHistoryItem } from '../src/types/chess';
import { STARTING_FEN } from '../src/utils/chessUtils';

describe('Analysis Board Hook & Game Review', () => {
  it('should initialize at starting FEN with root node', () => {
    const { result } = renderHook(() => useAnalysisBoard());

    expect(result.current.fen).toBe(STARTING_FEN);
    expect(result.current.turn).toBe('w');
    expect(result.current.isCheck).toBe(false);
    expect(result.current.isGameOver).toBe(false);
  });

  it('should play legal moves and update tree and board FEN', () => {
    const { result } = renderHook(() => useAnalysisBoard());

    act(() => {
      const moved = result.current.handleDropMove('e2' as ChessSquare, 'e4' as ChessSquare);
      expect(moved).toBe(true);
    });

    expect(result.current.turn).toBe('b');
    expect(result.current.lastMove).toEqual({ from: 'e2', to: 'e4' });
    expect(result.current.moveTree.getMainline().map((n) => n.san)).toEqual(['e4']);
  });

  it('should create and navigate branching variations', () => {
    const { result } = renderHook(() => useAnalysisBoard());

    // 1. e4 e5
    act(() => {
      result.current.handleDropMove('e2' as ChessSquare, 'e4' as ChessSquare);
    });
    act(() => {
      result.current.handleDropMove('e7' as ChessSquare, 'e5' as ChessSquare);
    });

    // Step back to after 1. e4
    act(() => {
      result.current.goToPreviousNode();
    });

    // Play alternative move 1... c5 (Sicilian)
    act(() => {
      result.current.handleDropMove('c7' as ChessSquare, 'c5' as ChessSquare);
    });

    // Main line should still be 1. e4 e5
    expect(result.current.moveTree.getMainline().map((n) => n.san)).toEqual(['e4', 'e5']);
    // Current node should be c5 (variation)
    expect(result.current.currentNode.san).toBe('c5');
    expect(result.current.currentNode.isMainline).toBe(false);
  });

  it('should load full game history for post-game review', () => {
    const { result } = renderHook(() => useAnalysisBoard());

    const mockHistory: MoveHistoryItem[] = [
      {
        id: '1',
        san: 'e4',
        from: 'e2' as ChessSquare,
        to: 'e4' as ChessSquare,
        piece: 'p',
        color: 'w',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        moveNumber: 1,
        isCheck: false,
        isCheckmate: false,
        timestamp: Date.now(),
      },
      {
        id: '2',
        san: 'e5',
        from: 'e7' as ChessSquare,
        to: 'e5' as ChessSquare,
        piece: 'p',
        color: 'b',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        moveNumber: 1,
        isCheck: false,
        isCheckmate: false,
        timestamp: Date.now(),
      },
      {
        id: '3',
        san: 'Nf3',
        from: 'g1' as ChessSquare,
        to: 'f3' as ChessSquare,
        piece: 'n',
        color: 'w',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        moveNumber: 2,
        isCheck: false,
        isCheckmate: false,
        timestamp: Date.now(),
      },
    ];

    act(() => {
      result.current.loadFromHistory(mockHistory);
    });

    expect(result.current.moveTree.getMainline().map((n) => n.san)).toEqual(['e4', 'e5', 'Nf3']);
    expect(result.current.currentNode.san).toBe('Nf3');
  });
});
