import { describe, expect, it } from 'vitest';
import { Chess, Square } from 'chess.js';
import { OPENING_REPERTOIRE, replayOpening, validateOpeningLine } from '../src/core/openings/openingRepertoire';
import {
  EMPTY_OPENING_PROGRESS,
  getOpeningAccuracy,
  getOpeningProgress,
  recordOpeningCompleted,
  recordOpeningMove,
  toggleOpeningFavorite,
} from '../src/core/openings/openingProgress';
import { OpeningLine } from '../src/types/opening';

describe('Opening repertoire move validation', () => {
  it('replays each common opening and variation into legal FEN positions', () => {
    expect(OPENING_REPERTOIRE.length).toBeGreaterThanOrEqual(8);
    for (const line of OPENING_REPERTOIRE) {
      expect(validateOpeningLine(line), line.id).toBe(true);
      const plies = replayOpening(line);
      expect(plies).toHaveLength(line.movesSan.length);
      expect(plies.every((ply) => ply.fenAfter.split(' ')[1] === (ply.color === 'w' ? 'b' : 'w'))).toBe(true);
    }
  });

  it('stores distinct named variations with their own move sequences and resulting positions', () => {
    const italian = OPENING_REPERTOIRE.filter((line) => line.name === 'Italian Game');
    expect(italian.map((line) => line.variation)).toEqual(['Giuoco Piano', 'Two Knights Defense']);
    expect(italian[0].movesSan).not.toEqual(italian[1].movesSan);
    expect(replayOpening(italian[0]).at(-1)?.fenAfter).not.toBe(replayOpening(italian[1]).at(-1)?.fenAfter);
  });

  it('rejects a line containing an illegal move', () => {
    const invalidLine: OpeningLine = { ...OPENING_REPERTOIRE[0], movesSan: ['e4', 'e5', 'Qh6'] };
    expect(validateOpeningLine(invalidLine)).toBe(false);
  });

  it('replays the listed UCI move legally from each recorded before-position', () => {
    const line = OPENING_REPERTOIRE.find((opening) => opening.id === 'ruy-lopez-morphy')!;
    const plies = replayOpening(line);
    const chess = new Chess();
    for (const ply of plies) {
      const move = chess.move({ from: ply.from as Square, to: ply.to as Square });
      expect(move?.san).toBe(ply.san);
      expect(chess.fen()).toBe(ply.fenAfter);
    }
  });
});

describe('Opening practice progress', () => {
  it('tracks correct and incorrect attempts, completed lines, and accuracy', () => {
    const wrong = recordOpeningMove(EMPTY_OPENING_PROGRESS, 'line-a', false);
    const correct = recordOpeningMove(wrong, 'line-a', true);
    const completed = recordOpeningCompleted(correct, 'line-a');
    const lineProgress = getOpeningProgress(completed, 'line-a');

    expect(lineProgress).toMatchObject({ linesPracticed: 1, movesCorrect: 1, movesAttempted: 2 });
    expect(getOpeningAccuracy(lineProgress)).toBe(50);
  });

  it('toggles opening favorites without duplicates', () => {
    const favorite = toggleOpeningFavorite(EMPTY_OPENING_PROGRESS, 'line-a');
    expect(favorite.favorites).toEqual(['line-a']);
    expect(toggleOpeningFavorite(favorite, 'line-a').favorites).toEqual([]);
  });
});