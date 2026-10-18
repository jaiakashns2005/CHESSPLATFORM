import { EndgameCategory, EndgameProgress } from '../../types/endgame';
import { PuzzleDifficulty } from '../../types/puzzle';

export const MIN_ENDGAME_RATING = 0;
export const MAX_ENDGAME_RATING = 100;
export const ENDGAME_RATING_STEP_UP = 7;
export const ENDGAME_RATING_STEP_DOWN = 10;

export const EMPTY_ENDGAME_PROGRESS: EndgameProgress = {
  attempted: 0,
  solved: 0,
  currentStreak: 0,
  bestStreak: 0,
  score: 0,
  adaptiveRating: MIN_ENDGAME_RATING,
  byCategory: {},
};

export const updateEndgameRating = (rating: number, solved: boolean): number => {
  const nextRating = rating + (solved ? ENDGAME_RATING_STEP_UP : -ENDGAME_RATING_STEP_DOWN);
  return Math.max(MIN_ENDGAME_RATING, Math.min(MAX_ENDGAME_RATING, nextRating));
};

export const getEndgameDifficulty = (rating: number): PuzzleDifficulty =>
  rating < 36 ? 'easy' : rating < 72 ? 'medium' : 'hard';

export const getEndgameSearchDepth = (rating: number): number => {
  const boundedRating = Math.max(MIN_ENDGAME_RATING, Math.min(MAX_ENDGAME_RATING, rating));
  return Math.min(16, 8 + Math.ceil(boundedRating / 13));
};

export const recordEndgameResult = (
  progress: EndgameProgress,
  category: EndgameCategory,
  solved: boolean,
  timeRemainingSeconds: number,
): EndgameProgress => {
  const currentStreak = solved ? progress.currentStreak + 1 : 0;
  const categoryProgress = progress.byCategory[category] || { attempted: 0, solved: 0 };
  return {
    attempted: progress.attempted + 1,
    solved: progress.solved + (solved ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(progress.bestStreak, currentStreak),
    score: progress.score + (solved ? 100 + Math.max(0, timeRemainingSeconds) * 2 : 0),
    adaptiveRating: updateEndgameRating(progress.adaptiveRating, solved),
    byCategory: {
      ...progress.byCategory,
      [category]: {
        attempted: categoryProgress.attempted + 1,
        solved: categoryProgress.solved + (solved ? 1 : 0),
      },
    },
  };
};

export const getEndgameAccuracy = (attempted: number, solved: number): number =>
  attempted === 0 ? 0 : Math.round((solved / attempted) * 100);
