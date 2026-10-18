import { PositionTrainingProgress, PositionalCategory } from '../../types/positional';

export const EMPTY_POSITIONAL_PROGRESS: PositionTrainingProgress = {
  score: 0,
  progress: { attempted: 0, solved: 0, currentStreak: 0, bestStreak: 0, byCategory: {} },
};

export const recordPositionalAttempt = (
  current: PositionTrainingProgress,
  category: PositionalCategory,
  solved: boolean,
): PositionTrainingProgress => {
  const previousCategory = current.progress.byCategory[category] || { attempted: 0, solved: 0 };
  const currentStreak = solved ? current.progress.currentStreak + 1 : 0;
  return {
    score: current.score + (solved ? 100 : 0),
    progress: {
      attempted: current.progress.attempted + 1,
      solved: current.progress.solved + (solved ? 1 : 0),
      currentStreak,
      bestStreak: Math.max(current.progress.bestStreak, currentStreak),
      byCategory: {
        ...current.progress.byCategory,
        [category]: {
          attempted: previousCategory.attempted + 1,
          solved: previousCategory.solved + (solved ? 1 : 0),
        },
      },
    },
  };
};

export const positionalAccuracy = (attempted: number, solved: number): number =>
  attempted === 0 ? 0 : Math.round((solved / attempted) * 100);