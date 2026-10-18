import { Chess } from 'chess.js';
import { calculateGameAccuracy, summarizeGameAnalysis } from '../engine/gameAnalysis';
import { EndgameProgress } from '../../types/endgame';
import { OpeningTrainingProgress } from '../../types/opening';
import { CoachActivity, CoachArea, CoachAreaMetric, CoachMovePhase, CoachProgress, CoachRecommendation, CoachReviewSummary } from '../../types/coach';
import { PuzzleStats } from '../../types/puzzle';
import { PositionTrainingProgress } from '../../types/positional';
import { GameAnalysisMove } from '../../types/gameAnalysis';

export const COACH_PROGRESS_STORAGE_KEY = 'chess-platform-coach-progress-v1';
export const COACH_DAILY_ACTIVITIES: Exclude<CoachArea, 'game-review'>[] = ['puzzles', 'openings', 'positional', 'endgame'];

export const EMPTY_COACH_PROGRESS: CoachProgress = {
  dailySessions: 0,
  totalTrainingSeconds: 0,
  lastSessionDate: null,
  currentDailyStreak: 0,
  bestDailyStreak: 0,
  weakAreas: [],
  activities: [],
  accuracyHistory: [],
  activeSessionDate: null,
  activeSessionStartedAt: null,
  activeSessionCompleted: [],
  pendingActivity: null,
  pendingActivityBaseline: null,
};

export const readCoachProgress = (): CoachProgress => {
  try {
    const stored = JSON.parse(localStorage.getItem(COACH_PROGRESS_STORAGE_KEY) || 'null') as Partial<CoachProgress> | null;
    if (stored && Number.isFinite(stored.dailySessions) && Number.isFinite(stored.totalTrainingSeconds) && Array.isArray(stored.activities) && Array.isArray(stored.activeSessionCompleted)) {
      const uniqueActivities = stored.activities.filter((activity, index, activities) =>
        activities.findIndex((candidate) => candidate.id === activity.id) === index);
      return {
        ...EMPTY_COACH_PROGRESS,
        ...stored,
        activities: uniqueActivities,
        accuracyHistory: Array.isArray(stored.accuracyHistory) ? stored.accuracyHistory : [],
      } as CoachProgress;
    }
  } catch {
    // Start from empty coach progress when browser storage is unavailable.
  }
  return EMPTY_COACH_PROGRESS;
};

export const saveCoachProgress = (progress: CoachProgress): void => {
  try {
    localStorage.setItem(COACH_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Keep coach progress available in memory when local storage is blocked.
  }
};

const accuracy = (attempted: number, solved: number) => attempted > 0 ? Math.round(solved / attempted * 100) : 0;

export const createCoachAreaMetrics = (
  puzzles: PuzzleStats,
  openings: OpeningTrainingProgress,
  positional: PositionTrainingProgress,
  endgames: EndgameProgress,
): CoachAreaMetric[] => {
  const openingEntries = Object.values(openings.byOpening);
  const openingAttempted = openingEntries.reduce((sum, entry) => sum + entry.movesAttempted, 0);
  const openingSolved = openingEntries.reduce((sum, entry) => sum + entry.movesCorrect, 0);
  return [
    { area: 'puzzles', label: 'Puzzles', attempted: puzzles.attempted, solved: puzzles.solved, accuracy: accuracy(puzzles.attempted, puzzles.solved) },
    { area: 'openings', label: 'Openings', attempted: openingAttempted, solved: openingSolved, accuracy: accuracy(openingAttempted, openingSolved) },
    { area: 'positional', label: 'Positional', attempted: positional.progress.attempted, solved: positional.progress.solved, accuracy: accuracy(positional.progress.attempted, positional.progress.solved) },
    { area: 'endgame', label: 'Endgame', attempted: endgames.attempted, solved: endgames.solved, accuracy: accuracy(endgames.attempted, endgames.solved) },
  ];
};

export const detectWeakAreas = (metrics: CoachAreaMetric[]): CoachAreaMetric[] =>
  metrics.filter((metric) => metric.attempted > 0).sort((left, right) => left.accuracy - right.accuracy || right.attempted - left.attempted);

export const getPuzzleDifficultyRecommendation = (rating: number): 'easy' | 'medium' | 'hard' =>
  rating < 36 ? 'easy' : rating < 72 ? 'medium' : 'hard';

export const recommendTraining = (metrics: CoachAreaMetric[], puzzleRating: number): CoachRecommendation => {
  const weakArea = detectWeakAreas(metrics)[0];
  const puzzleDifficulty = getPuzzleDifficultyRecommendation(puzzleRating);
  if (!weakArea) {
    return { area: 'puzzles', label: 'Puzzle Training', reason: 'Start with a tactical puzzle to establish a training baseline.', puzzleDifficulty };
  }
  return {
    area: weakArea.area,
    label: `${weakArea.label} Training`,
    reason: `${weakArea.label} is currently your lowest measured accuracy at ${weakArea.accuracy}%. Practicing it next should target a real gap.`,
    puzzleDifficulty,
  };
};

export const classifyMovePhase = (fen: string, moveNumber: number): CoachMovePhase => {
  try {
    const chess = new Chess(fen);
    const nonKingPieces = chess.board().flat().filter((piece) => piece && piece.type !== 'k').length;
    if (nonKingPieces <= 8) return 'endgame';
    return moveNumber <= 10 ? 'opening' : 'middlegame';
  } catch {
    return moveNumber <= 10 ? 'opening' : 'middlegame';
  }
};

const phaseAccuracy = (moves: GameAnalysisMove[], phase: CoachMovePhase): number | null => {
  const phaseMoves = moves.filter((move) => classifyMovePhase(move.fenAfter, move.moveNumber) === phase);
  return phaseMoves.length ? Math.round((calculateGameAccuracy(phaseMoves, 'w') + calculateGameAccuracy(phaseMoves, 'b')) / 2) : null;
};

export const createGameReviewSummary = (moves: GameAnalysisMove[]): CoachReviewSummary => {
  const summary = summarizeGameAnalysis(moves);
  const critical = moves.filter((move) => ['inaccuracy', 'mistake', 'blunder'].includes(move.classification));
  const recommendations: CoachRecommendation[] = [];
  const openingErrors = critical.some((move) => classifyMovePhase(move.fenAfter, move.moveNumber) === 'opening');
  const middleErrors = critical.some((move) => classifyMovePhase(move.fenAfter, move.moveNumber) === 'middlegame');
  const endgameErrors = critical.some((move) => classifyMovePhase(move.fenAfter, move.moveNumber) === 'endgame');
  const difficulty: CoachRecommendation['puzzleDifficulty'] = 'easy';

  if (openingErrors) recommendations.push({ area: 'openings', label: 'Opening Training', reason: 'The engine found a critical move loss during the opening phase.', puzzleDifficulty: difficulty });
  if (middleErrors) recommendations.push({ area: critical.some((move) => move.classification === 'mistake' || move.classification === 'blunder') ? 'puzzles' : 'positional', label: critical.some((move) => move.classification === 'mistake' || move.classification === 'blunder') ? 'Puzzle Training' : 'Positional Training', reason: 'The engine found critical middlegame decisions to review.', puzzleDifficulty: difficulty });
  if (endgameErrors) recommendations.push({ area: 'endgame', label: 'Endgame Training', reason: 'The engine found a critical decision in the endgame phase.', puzzleDifficulty: difficulty });

  return {
    blunders: summary.blunders,
    mistakes: summary.mistakes,
    inaccuracies: summary.inaccuracies,
    bestMoves: summary.bestMoves,
    missedOpportunities: moves.filter((move) => move.classification !== 'best' && move.centipawnLoss >= 50).length,
    phaseAccuracy: {
      opening: phaseAccuracy(moves, 'opening'),
      middlegame: phaseAccuracy(moves, 'middlegame'),
      endgame: phaseAccuracy(moves, 'endgame'),
    },
    overallAccuracy: Math.round((summary.whiteAccuracy + summary.blackAccuracy) / 2),
    recommendations: recommendations.length ? recommendations : [{ area: 'puzzles', label: 'Puzzle Training', reason: 'Review tactical patterns to keep improving calculation.', puzzleDifficulty: difficulty }],
  };
};

export const explainGameAnalysisMove = (move: GameAnalysisMove): string => {
  const phase = classifyMovePhase(move.fenAfter, move.moveNumber);
  if (move.classification === 'best' || move.classification === 'excellent') {
    return `What happened: ${move.playedMoveSan} matched Stockfish’s top choice. Why it worked: it preserved the position’s evaluation (${move.evaluationAfter}). Better idea: keep using the same calculation process. Next time: check forcing replies before you commit.`;
  }
  return `What happened: ${move.playedMoveSan} lost about ${Math.round(move.centipawnLoss)} centipawns in the ${phase}. Why it was inaccurate: Stockfish’s line keeps a better position with ${move.bestMoveSan}. Better idea: compare checks, captures, and threats before choosing. Next time: pause to identify the opponent’s strongest reply.`;
};

export const getNextDailyActivity = (
  completed: CoachArea[],
  recommendation: CoachRecommendation,
): CoachArea | null => {
  const preferred = recommendation.area === 'game-review' ? 'puzzles' : recommendation.area;
  const order: CoachArea[] = [preferred, ...COACH_DAILY_ACTIVITIES.filter((activity) => activity !== preferred), 'game-review'];
  return order.find((activity) => !completed.includes(activity)) || null;
};

const dateKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);
const yesterdayKey = (timestamp: number) => dateKey(timestamp - 24 * 60 * 60 * 1000);

export const startCoachDailySession = (progress: CoachProgress, timestamp: number): CoachProgress => {
  const today = dateKey(timestamp);
  if (progress.activeSessionDate === today && progress.activeSessionStartedAt !== null) return progress;
  const continuingStreak = progress.lastSessionDate === yesterdayKey(timestamp);
  const currentDailyStreak = continuingStreak ? progress.currentDailyStreak + 1 : progress.lastSessionDate === today ? progress.currentDailyStreak : 1;
  return {
    ...progress,
    dailySessions: progress.dailySessions + (progress.lastSessionDate === today ? 0 : 1),
    lastSessionDate: today,
    currentDailyStreak,
    bestDailyStreak: Math.max(progress.bestDailyStreak, currentDailyStreak),
    activeSessionDate: today,
    activeSessionStartedAt: timestamp,
    activeSessionCompleted: [],
  };
};

export const completeCoachActivity = (progress: CoachProgress, area: CoachArea, detail: string, timestamp: number): CoachProgress => {
  const activity: CoachActivity = { id: `${timestamp}-${area}`, label: area, detail, at: timestamp };
  return {
    ...progress,
    activeSessionCompleted: progress.activeSessionCompleted.includes(area) ? progress.activeSessionCompleted : [...progress.activeSessionCompleted, area],
    activities: [activity, ...progress.activities].slice(0, 20),
  };
};

export const queueCoachActivity = (progress: CoachProgress, area: CoachArea, baseline: number): CoachProgress => ({
  ...progress,
  pendingActivity: area,
  pendingActivityBaseline: baseline,
});

export const clearPendingCoachActivity = (progress: CoachProgress): CoachProgress => ({
  ...progress,
  pendingActivity: null,
  pendingActivityBaseline: null,
});

export const recordCoachAccuracySnapshot = (
  progress: CoachProgress,
  accuracy: number,
  positionsAttempted: number,
  timestamp: number,
): CoachProgress => {
  const snapshot = { date: dateKey(timestamp), accuracy, positionsAttempted };
  const history = [...progress.accuracyHistory];
  const last = history[history.length - 1];
  if (last?.date === snapshot.date) {
    if (last.accuracy === accuracy && last.positionsAttempted === positionsAttempted) return progress;
    history[history.length - 1] = snapshot;
  } else {
    history.push(snapshot);
  }
  return { ...progress, accuracyHistory: history.slice(-30) };
};

export const finishCoachDailySession = (progress: CoachProgress, timestamp: number): CoachProgress => {
  if (progress.activeSessionStartedAt === null) return progress;
  return {
    ...progress,
    totalTrainingSeconds: progress.totalTrainingSeconds + Math.max(0, Math.round((timestamp - progress.activeSessionStartedAt) / 1000)),
    activeSessionStartedAt: null,
  };
};
