import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

describe('Game History, Undo & PGN Processing', () => {
  it('should record moves in standard algebraic notation (SAN)', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('c5'); // Sicilian Defense
    chess.move('Nf3');
    chess.move('d6');
    chess.move('d4');
    chess.move('cxd4');

    const history = chess.history();
    expect(history).toEqual(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4']);
  });

  it('should support undoing moves correctly', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('e5');
    expect(chess.history().length).toBe(2);

    const undone = chess.undo();
    expect(undone?.san).toBe('e5');
    expect(chess.history().length).toBe(1);
    expect(chess.turn()).toBe('b');
  });

  it('should export valid PGN with headers and moves', () => {
    const chess = new Chess();
    chess.header('Event', 'Local Championship');
    chess.header('White', 'Magnus');
    chess.header('Black', 'Hikaru');
    chess.move('e4');
    chess.move('e5');
    chess.move('Nf3');

    const pgn = chess.pgn();
    expect(pgn).toContain('[Event "Local Championship"]');
    expect(pgn).toContain('[White "Magnus"]');
    expect(pgn).toContain('[Black "Hikaru"]');
    expect(pgn).toContain('1. e4 e5 2. Nf3');
  });

  it('should load custom position from FEN correctly', () => {
    const customFen = 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
    const chess = new Chess(customFen);

    expect(chess.fen()).toBe(customFen);
    expect(chess.turn()).toBe('w');
    // White can deliver mate
    const mateMove = chess.move('Qxf7#');
    expect(mateMove.san).toBe('Qxf7#');
    expect(chess.isCheckmate()).toBe(true);
  });
});
