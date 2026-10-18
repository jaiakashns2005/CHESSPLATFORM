import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { calculateMaterialBalance, isValidFEN, STARTING_FEN } from '../src/utils/chessUtils';

describe('Chess Rules - Basic Mechanics & Legal Moves', () => {
  it('should initialize with standard starting FEN', () => {
    const chess = new Chess();
    expect(chess.fen()).toBe(STARTING_FEN);
    expect(chess.turn()).toBe('w');
    expect(chess.isGameOver()).toBe(false);
  });

  it('should calculate starting material balance as even (0)', () => {
    const balance = calculateMaterialBalance(STARTING_FEN);
    expect(balance.score).toBe(0);
    expect(balance.advantageColor).toBeNull();
    expect(balance.advantageDiff).toBe(0);
    expect(balance.whiteCaptured).toEqual([]);
    expect(balance.blackCaptured).toEqual([]);
  });

  it('should allow legal pawn moves (e2-e4, d7-d5)', () => {
    const chess = new Chess();
    const move1 = chess.move({ from: 'e2', to: 'e4' });
    expect(move1).toBeTruthy();
    expect(move1?.san).toBe('e4');
    expect(chess.turn()).toBe('b');

    const move2 = chess.move({ from: 'd7', to: 'd5' });
    expect(move2).toBeTruthy();
    expect(move2?.san).toBe('d5');
    expect(chess.turn()).toBe('w');
  });

  it('should allow piece captures and update material balance', () => {
    const chess = new Chess();
    chess.move('e4');
    chess.move('d5');
    const captureMove = chess.move('exd5');

    expect(captureMove.captured).toBe('p');
    const balance = calculateMaterialBalance(chess.fen());
    expect(balance.score).toBe(1);
    expect(balance.advantageColor).toBe('w');
    expect(balance.advantageDiff).toBe(1);
    expect(balance.whiteCaptured).toContain('p');
  });

  it('should disallow illegal moves (e.g. pawn moving backwards or knight through impossible paths)', () => {
    const chess = new Chess();
    expect(() => chess.move({ from: 'e2', to: 'e5' })).toThrow();
    expect(() => chess.move({ from: 'a1', to: 'a4' })).toThrow();
  });

  it('should validate valid and invalid FEN strings', () => {
    expect(isValidFEN(STARTING_FEN).valid).toBe(true);
    expect(isValidFEN('8/8/8/8/8/8/8/8 w - - 0 1').valid).toBe(false); // No kings
    expect(isValidFEN('invalid string').valid).toBe(false);
  });
});
