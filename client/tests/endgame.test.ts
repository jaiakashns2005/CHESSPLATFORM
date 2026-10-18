import { describe, expect, it } from 'vitest';
import { Chess, Move } from 'chess.js';
import { createEndgameChallenge, ENDGAME_POSITION_BANK, endgamePositionKey, generateEndgameCandidate, validateEndgameMove, validateEndgameSeed } from '../src/core/endgame/endgamePositions';
import {
  EMPTY_ENDGAME_PROGRESS,
  getEndgameAccuracy,
  getEndgameDifficulty,
  getEndgameSearchDepth,
  MAX_ENDGAME_RATING,
  recordEndgameResult,
} from '../src/core/endgame/endgameProgress';
import { ENDGAME_CATEGORIES } from '../src/types/endgame';

const toUci = (move: Move) => `${move.from}${move.to}${move.promotion || ''}`;

const seededRandom = () => {
  let seed = 77;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
};

describe('Endgame position bank and generation', () => {
  it('contains a legal seed for every endgame category', () => {
    expect(new Set(ENDGAME_POSITION_BANK.map((position) => position.category)).size).toBe(ENDGAME_CATEGORIES.length);
    for (const position of ENDGAME_POSITION_BANK) expect(validateEndgameSeed(position), position.id).toBe(true);
  });

  it('generates legal positions and avoids immediate repeats', () => {
    const random = seededRandom();
    const seen = new Set<string>();
    const first = generateEndgameCandidate(seen, random);
    seen.add(endgamePositionKey(first.fen));
    const second = generateEndgameCandidate(seen, random);

    expect(new Chess(first.fen).moves().length).toBeGreaterThan(0);
    expect(new Chess(second.fen).moves().length).toBeGreaterThan(0);
    expect(endgamePositionKey(second.fen)).not.toBe(endgamePositionKey(first.fen));
  });

  it('generates legal variants within a selected category', () => {
    for (const category of ENDGAME_CATEGORIES) {
      const candidate = generateEndgameCandidate(new Set(), seededRandom(), category);
      expect(candidate.category).toBe(category);
      expect(validateEndgameSeed(candidate)).toBe(true);
    }
  });

  it('validates correct and incorrect moves against the legal answer', () => {
    const seed = ENDGAME_POSITION_BANK[0];
    const chess = new Chess(seed.fen);
    const legalMove = chess.moves({ verbose: true })[0];
    const bestMove = toUci(legalMove);
    const candidate = { ...seed, id: `${seed.id}:test` };
    const challenge = createEndgameChallenge(candidate, 'easy', bestMove);

    expect(challenge).not.toBeNull();
    expect(validateEndgameMove(seed.fen, bestMove, bestMove)).toBe(true);
    expect(validateEndgameMove(seed.fen, bestMove, 'a1a8')).toBe(false);
    expect(createEndgameChallenge(candidate, 'easy', 'a1a8')).toBeNull();
    expect(createEndgameChallenge(candidate, 'easy', null)).toBeNull();
  });
});

describe('Endgame progress and automatic difficulty', () => {
  it('tracks score, accuracy, streak, and category progress', () => {
    const solved = recordEndgameResult(EMPTY_ENDGAME_PROGRESS, 'King + Pawn vs King', true, 30);
    expect(solved).toMatchObject({ attempted: 1, solved: 1, currentStreak: 1, bestStreak: 1, score: 160 });
    expect(solved.byCategory['King + Pawn vs King']).toEqual({ attempted: 1, solved: 1 });
    const missed = recordEndgameResult(solved, 'Rook Endgames', false, 20);
    expect(missed).toMatchObject({ attempted: 2, solved: 1, currentStreak: 0, bestStreak: 1 });
    expect(getEndgameAccuracy(missed.attempted, missed.solved)).toBe(50);
    expect(missed.byCategory['Rook Endgames']).toEqual({ attempted: 1, solved: 0 });
  });

  it('increases difficulty gradually after correct answers', () => {
    let progress = EMPTY_ENDGAME_PROGRESS;
    expect(getEndgameDifficulty(progress.adaptiveRating)).toBe('easy');
    const first = recordEndgameResult(progress, 'Opposition', true, 30);
    expect(first.adaptiveRating).toBe(7);
    expect(getEndgameDifficulty(first.adaptiveRating)).toBe('easy');
    expect(getEndgameSearchDepth(first.adaptiveRating)).toBeGreaterThan(getEndgameSearchDepth(progress.adaptiveRating));

    progress = first;
    for (let correct = 1; correct < 6; correct += 1) progress = recordEndgameResult(progress, 'Opposition', true, 30);
    expect(getEndgameDifficulty(progress.adaptiveRating)).toBe('medium');
    for (let correct = 0; correct < 6; correct += 1) progress = recordEndgameResult(progress, 'Opposition', true, 30);
    expect(getEndgameDifficulty(progress.adaptiveRating)).toBe('hard');
  });

  it('decreases difficulty after mistakes and clamps rating and search depth', () => {
    let progress = EMPTY_ENDGAME_PROGRESS;
    for (let correct = 0; correct < 6; correct += 1) progress = recordEndgameResult(progress, 'Opposition', true, 30);
    expect(getEndgameDifficulty(progress.adaptiveRating)).toBe('medium');
    const mistake = recordEndgameResult(progress, 'Opposition', false, 30);
    expect(mistake.adaptiveRating).toBeLessThan(progress.adaptiveRating);
    expect(getEndgameSearchDepth(0)).toBe(8);
    expect(getEndgameSearchDepth(MAX_ENDGAME_RATING)).toBe(16);
    for (let missed = 0; missed < 20; missed += 1) progress = recordEndgameResult(progress, 'Opposition', false, 0);
    expect(progress.adaptiveRating).toBe(0);
    expect(getEndgameDifficulty(progress.adaptiveRating)).toBe('easy');
  });
});
