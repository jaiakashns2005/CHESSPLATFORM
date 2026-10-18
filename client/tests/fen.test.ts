import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { isValidFEN, STARTING_FEN } from '../src/utils/chessUtils';

describe('FEN Subsystem - Full State Restoration & Validation', () => {
  it('should validate and load starting FEN correctly', () => {
    const res = isValidFEN(STARTING_FEN);
    expect(res.valid).toBe(true);

    const chess = new Chess(STARTING_FEN);
    expect(chess.turn()).toBe('w');
    expect(chess.fen()).toBe(STARTING_FEN);
  });

  it('should preserve Black to move from FEN', () => {
    const blackToMoveFen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const chess = new Chess(blackToMoveFen);
    expect(chess.turn()).toBe('b');
  });

  it('should restore specific castling rights from FEN', () => {
    // Only White Kingside (K) and Black Queenside (q)
    const partialCastlingFen = 'r3k2r/8/8/8/8/8/8/R3K2R w Kq - 0 1';
    const chess = new Chess(partialCastlingFen);

    // White Kingside is legal
    expect(() => chess.move('O-O')).not.toThrow();

    // Reset and test White Queenside is illegal
    const chess2 = new Chess(partialCastlingFen);
    expect(() => chess2.move('O-O-O')).toThrow();
  });

  it('should restore en-passant square and execute en-passant capture', () => {
    // En passant square is e6
    const enPassantFen = 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3';
    const chess = new Chess(enPassantFen);

    const epMove = chess.move('exf6');
    expect(epMove.san).toBe('exf6');
    expect(epMove.captured).toBe('p');
  });

  it('should preserve halfmove clock and fullmove counters', () => {
    const lateGameFen = '8/5k2/8/8/8/8/5K2/8 w - - 48 65';
    const chess = new Chess(lateGameFen);

    expect(chess.fen()).toBe(lateGameFen);
  });

  it('should reject invalid and corrupted FEN notations safely', () => {
    expect(isValidFEN('').valid).toBe(false);
    expect(isValidFEN('not-a-fen').valid).toBe(false);
    expect(isValidFEN('8/8/8/8/8/8/8/8 w - - 0 1').valid).toBe(false); // Missing kings
    expect(isValidFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq').valid).toBe(false); // Incomplete
    expect(isValidFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR/EXTRA w KQkq - 0 1').valid).toBe(false); // 9 ranks
  });
});
