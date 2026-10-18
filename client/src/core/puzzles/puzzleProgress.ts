import { PuzzleDifficulty, PuzzleStats } from '../../types/puzzle';

export const MIN_ADAPTIVE_RATING = 0;
export const MAX_ADAPTIVE_RATING = 100;
export const ADAPTIVE_RATING_STEP_UP = 7;
export const ADAPTIVE_RATING_STEP_DOWN = 10;

export const updateAdaptiveRating = (rating: number, solved: boolean): number => {
  const adjusted = rating + (solved ? ADAPTIVE_RATING_STEP_UP : -ADAPTIVE_RATING_STEP_DOWN);
  return Math.min(MAX_ADAPTIVE_RATING, Math.max(MIN_ADAPTIVE_RATING, adjusted));
};

export const getAdaptiveDifficulty = (rating: number): PuzzleDifficulty =>
  rating < 36 ? 'easy' : rating < 72 ? 'medium' : 'hard';

export const getAdaptiveSearchDepth = (rating: number): number => {
  const boundedRating = Math.min(MAX_ADAPTIVE_RATING, Math.max(MIN_ADAPTIVE_RATING, rating));
  return Math.min(16, 8 + Math.ceil(boundedRating / 13));
};

export const EMPTY_PUZZLE_STATS: PuzzleStats = {
  attempted: 0,
  solved: 0,
  currentStreak: 0,
  bestStreak: 0,
  score: 0,
};

export const recordPuzzleResult = (stats: PuzzleStats, solved: boolean, timeRemainingSeconds: number): PuzzleStats => {
  const currentStreak = solved ? stats.currentStreak + 1 : 0;
  return {
    attempted: stats.attempted + 1,
    solved: stats.solved + (solved ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    score: stats.score + (solved ? 100 + Math.max(0, timeRemainingSeconds) * 2 : 0),
  };
};

export const getPuzzleAccuracy = (stats: PuzzleStats): number =>
  stats.attempted === 0 ? 0 : Math.round((stats.solved / stats.attempted) * 100);