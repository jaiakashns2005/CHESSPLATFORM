import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { POSITIONAL_CHALLENGES, getPositionalFen, validatePositionalChallenge } from '../src/core/positional/positionCatalog';
import { EMPTY_POSITIONAL_PROGRESS, positionalAccuracy, recordPositionalAttempt } from '../src/core/positional/positionalProgress';
import { PositionalChallenge } from '../src/types/positional';

describe('Positional challenge validation', () => {
  it('provides a legal replayed position for every positional category', () => {
    expect(POSITIONAL_CHALLENGES).toHaveLength(10);
    expect(new Set(POSITIONAL_CHALLENGES.map((challenge) => challenge.category)).size).toBe(10);
    expect(new Set(POSITIONAL_CHALLENGES.map((challenge) => challenge.difficulty))).toEqual(new Set(['beginner', 'intermediate', 'advanced']));
    for (const challenge of POSITIONAL_CHALLENGES) {
      expect(validatePositionalChallenge(challenge), challenge.id).toBe(true);
      const chess = new Chess(getPositionalFen(challenge));
      expect(chess.isGameOver()).toBe(false);
      expect(chess.moves().length).toBeGreaterThan(0);
    }
  });

  it('rejects an illegal contextual move sequence', () => {
    const invalid: PositionalChallenge = {
      ...POSITIONAL_CHALLENGES[0],
      contextMovesSan: ['e4', 'e5', 'Qh6'],
    };
    expect(validatePositionalChallenge(invalid)).toBe(false);
    expect(() => getPositionalFen(invalid)).toThrow();
  });
});

describe('Positional training score and progress', () => {
  it('tracks attempted and solved positions per category, score, and accuracy', () => {
    const category = POSITIONAL_CHALLENGES[0].category;
    const incorrect = recordPositionalAttempt(EMPTY_POSITIONAL_PROGRESS, category, false);
    const solved = recordPositionalAttempt(incorrect, category, true);

    expect(solved.score).toBe(100);
    expect(solved.progress).toMatchObject({ attempted: 2, solved: 1, currentStreak: 1, bestStreak: 1 });
    expect(solved.progress.byCategory[category]).toEqual({ attempted: 2, solved: 1 });
    expect(positionalAccuracy(solved.progress.attempted, solved.progress.solved)).toBe(50);
  });

  it('resets the current streak after a miss but keeps the best streak', () => {
    const category = POSITIONAL_CHALLENGES[0].category;
    const one = recordPositionalAttempt(EMPTY_POSITIONAL_PROGRESS, category, true);
    const two = recordPositionalAttempt(one, category, true);
    const missed = recordPositionalAttempt(two, category, false);
    expect(missed.progress.currentStreak).toBe(0);
    expect(missed.progress.bestStreak).toBe(2);
    expect(missed.progress.attempted).toBe(3);
  });
});