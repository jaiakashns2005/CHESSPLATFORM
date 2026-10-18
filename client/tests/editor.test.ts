import { describe, it, expect } from 'vitest';
import {
  parseFENToEditorState,
  generateFENFromEditorState,
  validatePositionEditorState,
} from '../src/core/positionValidator';
import { STARTING_FEN } from '../src/utils/chessUtils';

describe('Position Editor & Legality Validation', () => {
  it('should parse standard starting FEN and regenerate the exact FEN', () => {
    const state = parseFENToEditorState(STARTING_FEN);
    expect(state.turn).toBe('w');
    expect(state.castling.whiteKingside).toBe(true);
    expect(state.castling.whiteQueenside).toBe(true);
    expect(state.castling.blackKingside).toBe(true);
    expect(state.castling.blackQueenside).toBe(true);

    const generated = generateFENFromEditorState(state);
    expect(generated).toBe(STARTING_FEN);

    const validation = validatePositionEditorState(state);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should reject position missing a King', () => {
    // Only White King, no Black King
    const noBlackKingFen = '8/8/8/8/8/8/4K3/8 w - - 0 1';
    const state = parseFENToEditorState(noBlackKingFen);
    const validation = validatePositionEditorState(state);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Black King'))).toBe(true);
  });

  it('should reject position with multiple Kings of same color', () => {
    // 2 White Kings
    const twoWhiteKingsFen = '8/8/8/4K3/8/8/4K3/4k3 w - - 0 1';
    const state = parseFENToEditorState(twoWhiteKingsFen);
    const validation = validatePositionEditorState(state);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('2 White Kings'))).toBe(true);
  });

  it('should reject pawns placed on 1st or 8th rank', () => {
    // White pawn on e8, Black pawn on d1
    const pawnsOnBackRankFen = '4P3/8/8/8/8/8/8/3p1k1K w - - 0 1';
    const state = parseFENToEditorState(pawnsOnBackRankFen);
    const validation = validatePositionEditorState(state);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('pawn cannot be placed on the back ranks'))).toBe(true);
  });

  it('should reject adjacent Kings', () => {
    // Kings on e4 and e5 (adjacent)
    const adjacentKingsFen = '8/8/8/4k3/4K3/8/8/8 w - - 0 1';
    const state = parseFENToEditorState(adjacentKingsFen);
    const validation = validatePositionEditorState(state);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('adjacent squares'))).toBe(true);
  });

  it('should reject positions where the side NOT to move is in check', () => {
    // White to move, but Black King on e8 is in check from White Rook on e1
    const illegalCheckFen = '4k3/8/8/8/8/8/8/4R2K w - - 0 1';
    const state = parseFENToEditorState(illegalCheckFen);
    const validation = validatePositionEditorState(state);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('not to move') && e.includes('in check'))).toBe(true);
  });
});
