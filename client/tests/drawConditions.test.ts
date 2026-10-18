import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

describe('Game Termination & Draw Conditions', () => {
  describe('Checkmate', () => {
    it("should detect Fool's Mate (Fastest Checkmate)", () => {
      const chess = new Chess();
      chess.move('f3');
      chess.move('e5');
      chess.move('g4');
      const mateMove = chess.move('Qh4#');

      expect(mateMove.san).toBe('Qh4#');
      expect(chess.isCheckmate()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
      expect(chess.turn()).toBe('w'); // White has no legal moves and is checkmated
    });

    it("should detect Scholar's Mate", () => {
      const chess = new Chess();
      chess.move('e4');
      chess.move('e5');
      chess.move('Bc4');
      chess.move('Nc6');
      chess.move('Qh5');
      chess.move('Nf6');
      const mate = chess.move('Qxf7#');

      expect(mate.san).toBe('Qxf7#');
      expect(chess.isCheckmate()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
    });
  });

  describe('Stalemate', () => {
    it('should detect Stalemate when king has no legal moves and is not in check', () => {
      // Black King on a8, White Queen on b6, White King on h1. Black to move.
      const fen = 'k7/8/1Q6/8/8/8/8/7K b - - 0 1';
      const chess = new Chess(fen);

      expect(chess.inCheck()).toBe(false);
      expect(chess.isStalemate()).toBe(true);
      expect(chess.isDraw()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
    });
  });

  describe('Threefold Repetition', () => {
    it('should detect Draw by Threefold Repetition', () => {
      const chess = new Chess();

      // Knights shuffle back and forth 3 times
      chess.move('Nf3'); // 1
      chess.move('Nf6');
      chess.move('Ng1');
      chess.move('Ng8'); // back to start

      chess.move('Nf3'); // 2
      chess.move('Nf6');
      chess.move('Ng1');
      chess.move('Ng8'); // back to start 2nd time

      chess.move('Nf3'); // 3
      chess.move('Nf6');
      chess.move('Ng1');
      chess.move('Ng8'); // 3rd repetition

      expect(chess.isThreefoldRepetition()).toBe(true);
      expect(chess.isDraw()).toBe(true);
    });
  });

  describe('Insufficient Material', () => {
    it('should detect King vs King as insufficient material', () => {
      const fen = '8/8/8/4k3/8/8/4K3/8 w - - 0 1';
      const chess = new Chess(fen);
      expect(chess.isInsufficientMaterial()).toBe(true);
      expect(chess.isDraw()).toBe(true);
    });

    it('should detect King + Bishop vs King as insufficient material', () => {
      const fen = '8/8/8/4k3/8/2B5/4K3/8 w - - 0 1';
      const chess = new Chess(fen);
      expect(chess.isInsufficientMaterial()).toBe(true);
      expect(chess.isDraw()).toBe(true);
    });

    it('should detect King + Knight vs King as insufficient material', () => {
      const fen = '8/8/8/4k3/8/2N5/4K3/8 w - - 0 1';
      const chess = new Chess(fen);
      expect(chess.isInsufficientMaterial()).toBe(true);
      expect(chess.isDraw()).toBe(true);
    });
  });

  describe('50-Move Rule', () => {
    it('should detect draw when 50 moves pass without pawn move or capture', () => {
      // FEN with halfmove clock at 100 (50 full moves)
      const fen = '8/5k2/8/8/8/8/5K2/8 w - - 100 51';
      const chess = new Chess(fen);
      expect(chess.isDraw()).toBe(true);
    });
  });
});
