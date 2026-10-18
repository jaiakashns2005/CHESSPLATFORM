import { beforeEach, describe, expect, it } from 'vitest';
import { createGameReviewSummary, createCoachAreaMetrics, detectWeakAreas, explainGameAnalysisMove, getNextDailyActivity, recommendTraining, startCoachDailySession, completeCoachActivity, finishCoachDailySession, queueCoachActivity, readCoachProgress, saveCoachProgress, EMPTY_COACH_PROGRESS, clearPendingCoachActivity, recordCoachAccuracySnapshot } from '../src/core/coach/coachProgress';
import { parseCoachGamePgn } from '../src/core/coach/gameReview';
import { GameAnalysisMove } from '../src/types/gameAnalysis';
import { EMPTY_ENDGAME_PROGRESS } from '../src/core/endgame/endgameProgress';
import { EMPTY_POSITIONAL_PROGRESS } from '../src/core/positional/positionalProgress';
import { EMPTY_PUZZLE_STATS } from '../src/core/puzzles/puzzleProgress';

const analysisMove = (partial: Partial<GameAnalysisMove> = {}): GameAnalysisMove => ({
  nodeId: 'm1',
  moveNumber: 12,
  color: 'w',
  playedMoveSan: 'Re1',
  playedMoveUci: 'f1e1',
  bestMoveSan: 'Qh5',
  bestMoveUci: 'd1h5',
  scoreBeforeCp: 100,
  scoreAfterCp: -80,
  evaluationBefore: '+1.0',
  evaluationAfter: '-0.8',
  centipawnLoss: 180,
  classification: 'mistake',
  fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  fenAfter: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
  ...partial,
});

beforeEach(() => localStorage.clear());

describe('Coach recommendations', () => {
  it('detects the weakest area using only measured results', () => {
    const metrics = [
      { area: 'puzzles' as const, label: 'Puzzles', attempted: 10, solved: 8, accuracy: 80 },
      { area: 'openings' as const, label: 'Openings', attempted: 4, solved: 1, accuracy: 25 },
      { area: 'positional' as const, label: 'Positional', attempted: 0, solved: 0, accuracy: 0 },
      { area: 'endgame' as const, label: 'Endgame', attempted: 5, solved: 3, accuracy: 60 },
    ];
    expect(detectWeakAreas(metrics).map((metric) => metric.area)).toEqual(['openings', 'endgame', 'puzzles']);
    expect(recommendTraining(metrics, 80)).toMatchObject({ area: 'openings', puzzleDifficulty: 'hard' });
  });

  it('builds dashboard metrics from persisted feature progress', () => {
    const metrics = createCoachAreaMetrics(
      { ...EMPTY_PUZZLE_STATS, attempted: 8, solved: 6 },
      { favorites: [], byOpening: { italian: { linesPracticed: 2, movesCorrect: 4, movesAttempted: 5, lastPracticedAt: 1 } } },
      { score: 300, progress: { ...EMPTY_POSITIONAL_PROGRESS.progress, attempted: 3, solved: 2 } },
      { ...EMPTY_ENDGAME_PROGRESS, attempted: 5, solved: 4 },
    );
    expect(metrics.find((metric) => metric.area === 'openings')).toMatchObject({ attempted: 5, solved: 4, accuracy: 80 });
    expect(metrics.find((metric) => metric.area === 'positional')).toMatchObject({ attempted: 3, solved: 2, accuracy: 67 });
  });

  it('automatically recommends a suitable puzzle difficulty from the stored rating', () => {
    expect(recommendTraining([], 0).puzzleDifficulty).toBe('easy');
    expect(recommendTraining([], 50).puzzleDifficulty).toBe('medium');
    expect(recommendTraining([], 80).puzzleDifficulty).toBe('hard');
  });
});

describe('Daily training and persistence', () => {
  it('chooses the recommendation first, then advances through unfinished daily activities', () => {
    const recommendation = recommendTraining([], 0);
    expect(getNextDailyActivity([], recommendation)).toBe('puzzles');
    expect(getNextDailyActivity(['puzzles'], recommendation)).toBe('openings');
    expect(getNextDailyActivity(['puzzles', 'openings', 'positional', 'endgame'], recommendation)).toBe('game-review');
    expect(getNextDailyActivity(['puzzles', 'openings', 'positional', 'endgame', 'game-review'], recommendation)).toBeNull();
  });

  it('tracks daily sessions, training time, streak, activity handoff, and local persistence', () => {
    const dayOne = Date.UTC(2026, 9, 1, 12);
    let progress = startCoachDailySession(EMPTY_COACH_PROGRESS, dayOne);
    progress = queueCoachActivity(progress, 'puzzles', 5);
    progress = clearPendingCoachActivity(progress);
    progress = completeCoachActivity(progress, 'puzzles', 'Completed 2 puzzles', dayOne + 60_000);
    progress = finishCoachDailySession(progress, dayOne + 5 * 60_000);
    progress = startCoachDailySession(progress, dayOne + 24 * 60 * 60 * 1000);

    expect(progress.dailySessions).toBe(2);
    expect(progress.currentDailyStreak).toBe(2);
    expect(progress.bestDailyStreak).toBe(2);
    expect(progress.totalTrainingSeconds).toBe(300);
    expect(progress.activities[0].detail).toBe('Completed 2 puzzles');
    saveCoachProgress(progress);
    expect(readCoachProgress()).toEqual(progress);
  });

  it('deduplicates stale repeated activity IDs while loading saved history', () => {
    const activity = { id: 'same-id', label: 'endgame' as const, detail: 'recorded once', at: 1 };
    localStorage.setItem('chess-platform-coach-progress-v1', JSON.stringify({
      ...EMPTY_COACH_PROGRESS,
      activities: [activity, { ...activity }],
    }));

    expect(readCoachProgress().activities).toEqual([activity]);
  });

  it('records daily accuracy changes without duplicating same-day snapshots', () => {
    const firstDay = Date.UTC(2026, 9, 1, 12);
    const first = recordCoachAccuracySnapshot(EMPTY_COACH_PROGRESS, 40, 5, firstDay);
    const updatedSameDay = recordCoachAccuracySnapshot(first, 60, 10, firstDay + 1000);
    const nextDay = recordCoachAccuracySnapshot(updatedSameDay, 70, 15, firstDay + 24 * 60 * 60 * 1000);

    expect(updatedSameDay.accuracyHistory).toHaveLength(1);
    expect(nextDay.accuracyHistory).toEqual([
      { date: '2026-10-01', accuracy: 60, positionsAttempted: 10 },
      { date: '2026-10-02', accuracy: 70, positionsAttempted: 15 },
    ]);
  });
});

describe('Stockfish game review inputs and explanations', () => {
  it('parses a completed PGN to legal review moves', () => {
    const parsed = parseCoachGamePgn('[Event "Coach review"]\n\n1. e4 e5 2. Nf3 Nc6 1-0');
    expect(parsed.moves).toHaveLength(4);
    expect(parsed.moves.map((move) => move.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6']);
    expect(parsed.initialFen).toContain('rnbqkbnr');
    expect(() => parseCoachGamePgn('not a game')).toThrow();
    expect(() => parseCoachGamePgn('1. e4 e5')).toThrow(/completed game/);
  });

  it('summarizes engine-classified phases and provides a four-part explanation', () => {
    const opening = analysisMove({ moveNumber: 3, fenAfter: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 2', classification: 'inaccuracy', centipawnLoss: 70 });
    const endgame = analysisMove({ nodeId: 'm2', moveNumber: 30, fenAfter: '8/8/4k3/8/4K3/4P3/8/8 b - - 0 30', classification: 'blunder', centipawnLoss: 250 });
    const review = createGameReviewSummary([opening, endgame]);
    expect(review.inaccuracies).toBe(1);
    expect(review.blunders).toBe(1);
    expect(review.missedOpportunities).toBe(2);
    expect(review.phaseAccuracy.opening).not.toBeNull();
    expect(review.phaseAccuracy.endgame).not.toBeNull();
    expect(review.recommendations.map((item) => item.area)).toContain('openings');
    expect(review.recommendations.map((item) => item.area)).toContain('endgame');
    expect(explainGameAnalysisMove(opening)).toContain('What happened:');
    expect(explainGameAnalysisMove(opening)).toContain('Why it was inaccurate:');
    expect(explainGameAnalysisMove(opening)).toContain('Better idea:');
    expect(explainGameAnalysisMove(opening)).toContain('Next time:');
  });
});
