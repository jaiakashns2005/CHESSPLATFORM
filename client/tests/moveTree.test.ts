import { describe, it, expect } from 'vitest';
import { MoveTree } from '../src/core/moveTree';
import { ChessSquare } from '../src/types/chess';
import { STARTING_FEN } from '../src/utils/chessUtils';

describe('MoveTree Data Structure & Variations', () => {
  it('should initialize with root node at starting position', () => {
    const tree = new MoveTree(STARTING_FEN);
    expect(tree.nodes.size).toBe(1);
    const root = tree.getNode(tree.rootId);
    expect(root).toBeDefined();
    expect(root?.fen).toBe(STARTING_FEN);
    expect(root?.isMainline).toBe(true);
  });

  it('should add moves along the main line', () => {
    const tree = new MoveTree();
    const node1Id = tree.addMove(tree.rootId, {
      san: 'e4',
      from: 'e2' as ChessSquare,
      to: 'e4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    const node1 = tree.getNode(node1Id);
    expect(node1).toBeDefined();
    expect(node1?.san).toBe('e4');
    expect(node1?.isMainline).toBe(true);

    const node2Id = tree.addMove(node1Id, {
      san: 'e5',
      from: 'e7' as ChessSquare,
      to: 'e5' as ChessSquare,
      piece: 'p',
      color: 'b',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    const node2 = tree.getNode(node2Id);
    expect(node2?.isMainline).toBe(true);
    expect(tree.getMainline().map((n) => n.san)).toEqual(['e4', 'e5']);
  });

  it('should create side variations when an alternative move is added', () => {
    const tree = new MoveTree();
    tree.addMove(tree.rootId, {
      san: 'e4',
      from: 'e2' as ChessSquare,
      to: 'e4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'fen-e4',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    // 1. d4 (Alternative 1st move by White)
    const d4Id = tree.addMove(tree.rootId, {
      san: 'd4',
      from: 'd2' as ChessSquare,
      to: 'd4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'fen-d4',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    const d4Node = tree.getNode(d4Id);
    expect(d4Node?.isMainline).toBe(false); // Side variation
    expect(tree.getMainline().map((n) => n.san)).toEqual(['e4']);
  });

  it('should promote a variation to become the new main line', () => {
    const tree = new MoveTree();
    const e4Id = tree.addMove(tree.rootId, {
      san: 'e4',
      from: 'e2' as ChessSquare,
      to: 'e4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'fen-e4',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    const d4Id = tree.addMove(tree.rootId, {
      san: 'd4',
      from: 'd2' as ChessSquare,
      to: 'd4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'fen-d4',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    // Promote 1. d4 to mainline
    const promoted = tree.promoteToMainline(d4Id);
    expect(promoted).toBe(true);

    const d4Node = tree.getNode(d4Id);
    const e4Node = tree.getNode(e4Id);

    expect(d4Node?.isMainline).toBe(true);
    expect(e4Node?.isMainline).toBe(false);
    expect(tree.getMainline().map((n) => n.san)).toEqual(['d4']);
  });

  it('should delete a variation and all its descendants cleanly', () => {
    const tree = new MoveTree();
    const e4Id = tree.addMove(tree.rootId, {
      san: 'e4',
      from: 'e2' as ChessSquare,
      to: 'e4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'fen-e4',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    const d4Id = tree.addMove(tree.rootId, {
      san: 'd4',
      from: 'd2' as ChessSquare,
      to: 'd4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'fen-d4',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    const d5Id = tree.addMove(d4Id, {
      san: 'd5',
      from: 'd7' as ChessSquare,
      to: 'd5' as ChessSquare,
      piece: 'p',
      color: 'b',
      fen: 'fen-d5',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    expect(tree.nodes.has(d4Id)).toBe(true);
    expect(tree.nodes.has(d5Id)).toBe(true);

    // Delete 1. d4 variation subtree
    tree.deleteNode(d4Id);

    expect(tree.nodes.has(d4Id)).toBe(false);
    expect(tree.nodes.has(d5Id)).toBe(false);
    expect(tree.nodes.has(e4Id)).toBe(true);
  });

  it('should support position comments and recursive PGN export with variations', () => {
    const tree = new MoveTree();
    const e4Id = tree.addMove(tree.rootId, {
      san: 'e4',
      from: 'e2' as ChessSquare,
      to: 'e4' as ChessSquare,
      piece: 'p',
      color: 'w',
      fen: 'fen-e4',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    tree.setComment(e4Id, 'King Pawn Opening');

    tree.addMove(e4Id, {
      san: 'e5',
      from: 'e7' as ChessSquare,
      to: 'e5' as ChessSquare,
      piece: 'p',
      color: 'b',
      fen: 'fen-e5',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    // Variation: 1... c5 (Sicilian)
    tree.addMove(e4Id, {
      san: 'c5',
      from: 'c7' as ChessSquare,
      to: 'c5' as ChessSquare,
      piece: 'p',
      color: 'b',
      fen: 'fen-c5',
      moveNumber: 1,
      isCheck: false,
      isCheckmate: false,
    });

    const pgn = tree.exportTreePGN();
    expect(pgn).toContain('1. e4 {King Pawn Opening} e5 (1... c5)');
  });
});
