import { describe, expect, it } from 'vitest';
import { Chess, Square } from 'chess.js';
import {
  createEnginePuzzle,
  createPuzzleCandidate,
  getPuzzleByDifficulty,
  getPuzzlePositionKey,
  getPuzzleSearchDepth,
  PUZZLES,
  PUZZLE_DIFFICULTIES,
  PUZZLE_THEMES,
  selectUnseenPuzzle,
  validateEnginePuzzle,
  validatePuzzle,
} from '../src/core/puzzles/puzzleBank';
import {
  EMPTY_PUZZLE_STATS,
  getAdaptiveDifficulty,
  getAdaptiveSearchDepth,
  getPuzzleAccuracy,
  MAX_ADAPTIVE_RATING,
  MIN_ADAPTIVE_RATING,
  recordPuzzleResult,
  updateAdaptiveRating,
} from '../src/core/puzzles/puzzleProgress';

describe('Puzzle legality and validation', () => {
  it('contains legal FENs and complete legal solution lines', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(3);
    for (const puzzle of PUZZLES) expect(validatePuzzle(puzzle), puzzle.id).toBe(true);
    for (const difficulty of PUZZLE_DIFFICULTIES) {
      expect(getPuzzleByDifficulty(difficulty).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('replays the easy and medium checkmate solutions to actual checkmate', () => {
    for (const puzzle of PUZZLES.filter((item) => item.id.includes('mate'))) {
      const chess = new Chess(puzzle.fen);
      for (const uci of puzzle.solutionUci) {
        expect(chess.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square })).toBeTruthy();
      }
      expect(chess.isCheckmate()).toBe(true);
    }
  });

  it('rejects illegal solution moves and wrong side-to-move positions', () => {
    expect(validatePuzzle({ ...PUZZLES[0], solutionUci: ['a1a8'] })).toBe(false);
    expect(validatePuzzle({ ...PUZZLES[0], playerColor: 'b' })).toBe(false);
    expect(validatePuzzle({ ...PUZZLES[0], fen: 'invalid fen' })).toBe(false);
  });

  it('creates distinct legal positions for continuous puzzle generation', () => {
    let seed = 17;
    const random = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    const candidates = Array.from({ length: 8 }, () => createPuzzleCandidate(random));
    const keys = candidates.map((candidate) => getPuzzlePositionKey(candidate));

    expect(new Set(keys).size).toBe(candidates.length);
    for (const candidate of candidates) {
      const chess = new Chess(candidate.fen);
      expect(chess.turn()).toBe(candidate.playerColor);
      expect(chess.moves().length).toBeGreaterThan(0);
    }
  });

  it('selects an unseen next puzzle and never cycles through seen positions', () => {
    const first = PUZZLES[0];
    const seen = new Set([getPuzzlePositionKey(first)]);
    const next = selectUnseenPuzzle(PUZZLES, seen);

    expect(next).not.toBeNull();
    expect(getPuzzlePositionKey(next!)).not.toBe(getPuzzlePositionKey(first));
    expect(selectUnseenPuzzle(PUZZLES, new Set(PUZZLES.map(getPuzzlePositionKey)))).toBeNull();
  });

  it('accepts only a legal puzzle matching Stockfish’s best move', () => {
    const seed = PUZZLES[0];
    const generated = createEnginePuzzle({ fen: seed.fen, playerColor: seed.playerColor }, 'medium', seed.solutionUci[0]);

    expect(generated).not.toBeNull();
    expect(generated?.theme).toBe('Checkmate');
    expect(generated?.difficulty).toBe('medium');
    expect(validateEnginePuzzle(generated!, seed.solutionUci[0])).toBe(true);
    expect(validateEnginePuzzle(generated!, 'a1a8')).toBe(false);
    expect(validateEnginePuzzle(generated!, null)).toBe(false);
  });

  it('maps difficulty to progressively deeper Stockfish analysis', () => {
    expect(getPuzzleSearchDepth('easy')).toBe(8);
    expect(getPuzzleSearchDepth('medium')).toBe(12);
    expect(getPuzzleSearchDepth('hard')).toBe(16);
  });

  it('exposes every requested tactical theme for generated positions', () => {
    expect(PUZZLE_THEMES).toEqual([
      'Checkmate', 'Fork', 'Pin', 'Skewer', 'Discovered Attack', 'Double Attack',
      'Winning Material', 'Sacrifice', 'Defensive Tactics',
    ]);
  });
});

describe('Puzzle scoring and progress', () => {
  it('adds timed solve points and advances both streak counters', () => {
    const first = recordPuzzleResult(EMPTY_PUZZLE_STATS, true, 30);
    expect(first).toEqual({ attempted: 1, solved: 1, currentStreak: 1, bestStreak: 1, score: 160 });
    const second = recordPuzzleResult(first, true, 0);
    expect(second.currentStreak).toBe(2);
    expect(second.bestStreak).toBe(2);
    expect(second.score).toBe(260);
  });

  it('resets current streak on failure but preserves best streak and computes accuracy', () => {
    const solved = recordPuzzleResult(EMPTY_PUZZLE_STATS, true, 5);
    const failed = recordPuzzleResult(solved, false, 20);
    expect(failed.currentStreak).toBe(0);
    expect(failed.bestStreak).toBe(1);
    expect(failed.attempted).toBe(2);
    expect(failed.solved).toBe(1);
    expect(getPuzzleAccuracy(failed)).toBe(50);
  });
});

describe('Adaptive puzzle difficulty', () => {
  it('increases rating and difficulty gradually after correct answers', () => {
    const start = MIN_ADAPTIVE_RATING;
    const afterOne = updateAdaptiveRating(start, true);
    expect(afterOne).toBeGreaterThan(start);
    expect(getAdaptiveDifficulty(start)).toBe('easy');
    expect(getAdaptiveDifficulty(afterOne)).toBe('easy');
    expect(getAdaptiveSearchDepth(afterOne)).toBeGreaterThan(getAdaptiveSearchDepth(start));

    let rating = start;
    for (let correct = 0; correct < 6; correct += 1) rating = updateAdaptiveRating(rating, true);
    expect(getAdaptiveDifficulty(rating)).toBe('medium');
    expect(rating).toBeLessThan(MAX_ADAPTIVE_RATING);
  });

  it('raises difficulty in stages and never jumps from easy to hard', () => {
    let rating = MIN_ADAPTIVE_RATING;
    let previousDifficulty = getAdaptiveDifficulty(rating);
    let reachedMedium = false;
    let reachedHard = false;

    for (let solved = 0; solved < 15; solved += 1) {
      rating = updateAdaptiveRating(rating, true);
      const nextDifficulty = getAdaptiveDifficulty(rating);
      expect(!(previousDifficulty === 'easy' && nextDifficulty === 'hard')).toBe(true);
      if (nextDifficulty === 'medium') reachedMedium = true;
      if (nextDifficulty === 'hard') {
        expect(reachedMedium).toBe(true);
        reachedHard = true;
      }
      previousDifficulty = nextDifficulty;
    }

    expect(reachedMedium).toBe(true);
    expect(reachedHard).toBe(true);
  });

  it('lowers rating after a mistake and respects rating bounds', () => {
    expect(updateAdaptiveRating(50, false)).toBeLessThan(50);
    expect(getAdaptiveDifficulty(updateAdaptiveRating(42, false))).toBe('easy');
    expect(updateAdaptiveRating(MIN_ADAPTIVE_RATING, false)).toBe(MIN_ADAPTIVE_RATING);
    expect(updateAdaptiveRating(MAX_ADAPTIVE_RATING, true)).toBe(MAX_ADAPTIVE_RATING);
    expect(getAdaptiveSearchDepth(MIN_ADAPTIVE_RATING)).toBe(8);
    expect(getAdaptiveSearchDepth(MAX_ADAPTIVE_RATING)).toBe(16);
  });
});