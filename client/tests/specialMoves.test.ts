import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

describe('Special Moves - Castling, En Passant & Promotion', () => {
  describe('Castling Rights & Execution', () => {
    it('should allow White Kingside Castling (O-O) when path is clear', () => {
      const chess = new Chess();
      chess.move('e4');
      chess.move('e5');
      chess.move('Nf3');
      chess.move('Nc6');
      chess.move('Bc4');
      chess.move('Bc5');
      const castleMove = chess.move('O-O');

      expect(castleMove.san).toBe('O-O');
      expect(chess.get('g1')?.type).toBe('k');
      expect(chess.get('f1')?.type).toBe('r');
    });

    it('should allow White Queenside Castling (O-O-O) when path is clear', () => {
      const chess = new Chess();
      chess.move('d4');
      chess.move('d5');
      chess.move('Nc3');
      chess.move('Nc6');
      chess.move('Bf4');
      chess.move('Bf5');
      chess.move('Qd2');
      chess.move('Qd7');
      const castleQueenside = chess.move('O-O-O');

      expect(castleQueenside.san).toBe('O-O-O');
      expect(chess.get('c1')?.type).toBe('k');
      expect(chess.get('d1')?.type).toBe('r');
    });

    it('should disallow castling when king is in check', () => {
      // White king on e1 in check from Black queen on e7
      const fen = 'r3k2r/ppppqppp/8/8/8/8/PPPP1PPP/R3K2R w KQkq - 0 1';
      const chess = new Chess(fen);
      expect(chess.inCheck()).toBe(true);
      expect(() => chess.move('O-O')).toThrow();
      expect(() => chess.move('O-O-O')).toThrow();
    });

    it('should disallow castling through check (square f1 attacked)', () => {
      // Black bishop on a6 attacks f1
      const fen = 'r3k2r/pppp1ppp/b7/8/8/8/PPPP1PPP/R3K2R w KQkq - 0 1';
      const chess = new Chess(fen);
      expect(() => chess.move('O-O')).toThrow();
    });
  });

  describe('En Passant', () => {
    it('should execute en passant capture and remove the captured pawn', () => {
      const chess = new Chess();
      chess.move('e4');
      chess.move('a6');
      chess.move('e5');
      chess.move('d5'); // 2-square pawn push creating en passant square d6

      const epMove = chess.move('exd6');
      expect(epMove.san).toBe('exd6');
      expect(epMove.captured).toBe('p');
      // Pawn on d5 should be removed from board (empty square)
      expect(chess.get('d5')).toBeFalsy();
      // White pawn should be on d6
      expect(chess.get('d6')?.type).toBe('p');
      expect(chess.get('d6')?.color).toBe('w');
    });

    it('should expire en passant opportunity after next turn', () => {
      const chess = new Chess();
      chess.move('e4');
      chess.move('a6');
      chess.move('e5');
      chess.move('d5');
      chess.move('a3'); // White plays something else
      chess.move('b6'); // Black plays something else

      // En passant on d6 is no longer legal
      expect(() => chess.move('exd6')).toThrow();
    });
  });

  describe('Pawn Promotion', () => {
    it('should promote pawn to Queen by default or specified piece', () => {
      // White pawn on e7, black king on a1
      const fen = '8/4P3/8/8/8/8/8/k3K3 w - - 0 1';
      const chess = new Chess(fen);

      const promoMove = chess.move({ from: 'e7', to: 'e8', promotion: 'q' });
      expect(promoMove.san).toBe('e8=Q');
      expect(chess.get('e8')?.type).toBe('q');
      expect(chess.get('e8')?.color).toBe('w');
    });

    it('should promote pawn to Knight (underpromotion)', () => {
      const fen = '8/4P3/8/8/8/8/8/k3K3 w - - 0 1';
      const chess = new Chess(fen);

      const promoKnight = chess.move({ from: 'e7', to: 'e8', promotion: 'n' });
      expect(promoKnight.san).toBe('e8=N');
      expect(chess.get('e8')?.type).toBe('n');
    });

    it('should promote pawn with capture', () => {
      // White pawn on e7, black rook on d8
      const fen = '3r4/4P3/8/8/8/8/8/k3K3 w - - 0 1';
      const chess = new Chess(fen);

      const promoCapture = chess.move({ from: 'e7', to: 'd8', promotion: 'q' });
      expect(promoCapture.san).toBe('exd8=Q');
      expect(promoCapture.captured).toBe('r');
      expect(chess.get('d8')?.type).toBe('q');
    });
  });
});
