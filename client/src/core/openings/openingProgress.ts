import { OpeningProgress, OpeningTrainingProgress } from '../../types/opening';

export const EMPTY_OPENING_PROGRESS: OpeningTrainingProgress = { favorites: [], byOpening: {} };

export const getOpeningProgress = (progress: OpeningTrainingProgress, openingId: string): OpeningProgress =>
  progress.byOpening[openingId] || { linesPracticed: 0, movesCorrect: 0, movesAttempted: 0, lastPracticedAt: null };

export const recordOpeningMove = (progress: OpeningTrainingProgress, openingId: string, correct: boolean): OpeningTrainingProgress => {
  const current = getOpeningProgress(progress, openingId);
  return {
    ...progress,
    byOpening: {
      ...progress.byOpening,
      [openingId]: {
        ...current,
        movesAttempted: current.movesAttempted + 1,
        movesCorrect: current.movesCorrect + (correct ? 1 : 0),
        lastPracticedAt: Date.now(),
      },
    },
  };
};

export const recordOpeningCompleted = (progress: OpeningTrainingProgress, openingId: string): OpeningTrainingProgress => {
  const current = getOpeningProgress(progress, openingId);
  return {
    ...progress,
    byOpening: {
      ...progress.byOpening,
      [openingId]: { ...current, linesPracticed: current.linesPracticed + 1, lastPracticedAt: Date.now() },
    },
  };
};

export const toggleOpeningFavorite = (progress: OpeningTrainingProgress, openingId: string): OpeningTrainingProgress => ({
  ...progress,
  favorites: progress.favorites.includes(openingId)
    ? progress.favorites.filter((favoriteId) => favoriteId !== openingId)
    : [...progress.favorites, openingId],
});

export const getOpeningAccuracy = (progress: OpeningProgress): number =>
  progress.movesAttempted === 0 ? 0 : Math.round((progress.movesCorrect / progress.movesAttempted) * 100);