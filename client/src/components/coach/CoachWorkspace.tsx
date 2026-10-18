import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowRight, BrainCircuit, Check, Clock3, Lightbulb, Play, Sparkles, Target, Trophy, X } from 'lucide-react';
import { useGameAnalysis } from '../../hooks/useGameAnalysis';
import { createCoachAreaMetrics, completeCoachActivity, createGameReviewSummary, detectWeakAreas, explainGameAnalysisMove, finishCoachDailySession, getNextDailyActivity, readCoachProgress, recommendTraining, saveCoachProgress, startCoachDailySession, queueCoachActivity, recordCoachAccuracySnapshot } from '../../core/coach/coachProgress';
import { parseCoachGamePgn } from '../../core/coach/gameReview';
import { EMPTY_ENDGAME_PROGRESS } from '../../core/endgame/endgameProgress';
import { EMPTY_OPENING_PROGRESS } from '../../core/openings/openingProgress';
import { EMPTY_POSITIONAL_PROGRESS } from '../../core/positional/positionalProgress';
import { EMPTY_PUZZLE_STATS } from '../../core/puzzles/puzzleProgress';
import { ActiveAppView } from '../../types/analysis';
import { BoardTheme } from '../../types/chess';
import { CoachArea, CoachAreaMetric, CoachProgress } from '../../types/coach';
import { GameAnalysisMove } from '../../types/gameAnalysis';

const PUZZLE_STATS_KEY = 'chess-platform-puzzle-stats-v1';
const PUZZLE_SESSION_KEY = 'chess-platform-puzzle-session-v1';
const OPENING_PROGRESS_KEY = 'chess-platform-opening-progress-v1';
const POSITIONAL_PROGRESS_KEY = 'chess-platform-positional-progress-v1';
const ENDGAME_PROGRESS_KEY = 'chess-platform-endgame-progress-v1';

interface CoachWorkspaceProps {
  currentTheme: BoardTheme;
  onSelectView: (view: ActiveAppView) => void;
}

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') || fallback;
  } catch {
    return fallback;
  }
};

const readTrainingMetrics = () => createCoachAreaMetrics(
  readStored(PUZZLE_STATS_KEY, EMPTY_PUZZLE_STATS),
  readStored(OPENING_PROGRESS_KEY, EMPTY_OPENING_PROGRESS),
  readStored(POSITIONAL_PROGRESS_KEY, EMPTY_POSITIONAL_PROGRESS),
  readStored(ENDGAME_PROGRESS_KEY, EMPTY_ENDGAME_PROGRESS),
);

const getAreaCount = (metrics: CoachAreaMetric[], area: CoachArea): number =>
  metrics.find((metric) => metric.area === area)?.attempted || 0;

const getCoachPuzzleRating = (): number => {
  const session = readStored<{ adaptiveRating?: number } | null>(PUZZLE_SESSION_KEY, null);
  return Number.isFinite(session?.adaptiveRating) ? session!.adaptiveRating! : 0;
};

const areaView: Record<Exclude<CoachArea, 'game-review'>, ActiveAppView> = {
  puzzles: 'puzzles',
  openings: 'openings',
  positional: 'positional',
  endgame: 'endgame',
};

const areaLabel: Record<CoachArea, string> = {
  puzzles: 'Puzzle Training',
  openings: 'Opening Training',
  positional: 'Positional Training',
  endgame: 'Endgame Training',
  'game-review': 'Game Review',
};

export const CoachWorkspace: React.FC<CoachWorkspaceProps> = ({ onSelectView }) => {
  const [progress, setProgress] = useState<CoachProgress>(readCoachProgress);
  const progressRef = useRef(progress);
  const [metrics] = useState(readTrainingMetrics);
  const [puzzleRating] = useState(getCoachPuzzleRating);
  const [pgn, setPgn] = useState('');
  const [reviewInputError, setReviewInputError] = useState<string | null>(null);
  const [reviewedGameCount, setReviewedGameCount] = useState(0);
  const lastReviewSignature = useRef<string | null>(null);
  const processedHandoffRef = useRef(new Set<string>());
  const { status: analysisStatus, error: analysisError, moves, points, progress: analysisProgress, analyzeGame, cancelAnalysis } = useGameAnalysis();

  const recommendation = useMemo(() => recommendTraining(metrics, puzzleRating), [metrics, puzzleRating]);
  const weakAreas = useMemo(() => detectWeakAreas(metrics), [metrics]);
  const reviewSummary = useMemo(() => moves.length ? createGameReviewSummary(moves) : null, [moves]);
  const totalAttempted = metrics.reduce((sum, metric) => sum + metric.attempted, 0);
  const totalSolved = metrics.reduce((sum, metric) => sum + metric.solved, 0);
  const totalAccuracy = totalAttempted ? Math.round(totalSolved / totalAttempted * 100) : 0;
  const totalPositionsSolved = totalSolved + Object.values(readStored(OPENING_PROGRESS_KEY, EMPTY_OPENING_PROGRESS).byOpening).reduce((sum, entry) => sum + entry.linesPracticed, 0);
  const puzzleStats = readStored(PUZZLE_STATS_KEY, EMPTY_PUZZLE_STATS);
  const positionalProgress = readStored(POSITIONAL_PROGRESS_KEY, EMPTY_POSITIONAL_PROGRESS).progress;
  const endgameProgress = readStored(ENDGAME_PROGRESS_KEY, EMPTY_ENDGAME_PROGRESS);
  const currentStreak = Math.max(puzzleStats.currentStreak, positionalProgress.currentStreak, endgameProgress.currentStreak);
  const bestStreak = Math.max(puzzleStats.bestStreak, positionalProgress.bestStreak, endgameProgress.bestStreak);
  const totalScore = puzzleStats.score + readStored(POSITIONAL_PROGRESS_KEY, EMPTY_POSITIONAL_PROGRESS).score + endgameProgress.score;
  const nextActivity = getNextDailyActivity(progress.activeSessionCompleted, recommendation);
  progressRef.current = progress;

  const updateProgress = (update: (current: CoachProgress) => CoachProgress) => {
    const next = update(progressRef.current);
    progressRef.current = next;
    saveCoachProgress(next);
    setProgress(next);
  };

  useEffect(() => {
    const nextWeakAreas = weakAreas.map((area) => area.label);
    if (JSON.stringify(progress.weakAreas) === JSON.stringify(nextWeakAreas)) return;
    updateProgress((current) => ({ ...current, weakAreas: nextWeakAreas }));
  }, [progress.weakAreas, weakAreas]);

  useEffect(() => {
    updateProgress((current) => recordCoachAccuracySnapshot(current, totalAccuracy, totalAttempted, Date.now()));
  }, [totalAccuracy, totalAttempted]);

  useEffect(() => {
    const pending = progress.pendingActivity;
    if (!pending || pending === 'game-review' || progress.pendingActivityBaseline === null) return;
    const currentCount = getAreaCount(metrics, pending);
    if (currentCount <= progress.pendingActivityBaseline) return;
    const handoffKey = `${pending}:${progress.pendingActivityBaseline}:${currentCount}`;
    if (processedHandoffRef.current.has(handoffKey)) return;
    processedHandoffRef.current.add(handoffKey);
    updateProgress((current) => clearPendingActivity(current, pending, currentCount));
  }, [metrics, progress.pendingActivity, progress.pendingActivityBaseline]);

  useEffect(() => {
    if (analysisStatus !== 'completed' || moves.length === 0) return;
    const signature = moves.map((move) => `${move.nodeId}:${move.playedMoveUci}:${move.centipawnLoss}`).join('|');
    if (signature === lastReviewSignature.current) return;
    lastReviewSignature.current = signature;
    setReviewedGameCount((count) => count + 1);
    const timestamp = Date.now();
    updateProgress((current) => completeCoachActivity(current, 'game-review', `Reviewed ${moves.length} moves with Stockfish`, timestamp));
  }, [analysisStatus, moves]);

  const launchActivity = (area: CoachArea) => {
    if (area === 'game-review') {
      document.getElementById('coach-game-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const baseline = getAreaCount(metrics, area);
    updateProgress((current) => queueCoachActivity(current, area, baseline));
    onSelectView(areaView[area]);
  };

  const startDailyTraining = () => {
    updateProgress((current) => startCoachDailySession(current, Date.now()));
    const activity = getNextDailyActivity(progress.activeSessionCompleted, recommendation);
    if (activity) launchActivity(activity);
  };

  const finishDailyTraining = () => updateProgress((current) => finishCoachDailySession(current, Date.now()));

  const beginGameReview = () => {
    setReviewInputError(null);
    try {
      const parsed = parseCoachGamePgn(pgn);
      lastReviewSignature.current = null;
      analyzeGame(parsed.initialFen, parsed.moves, 12);
    } catch (error) {
      setReviewInputError(error instanceof Error ? error.message : String(error));
    }
  };

  const jumpToRecommendation = (area: CoachArea) => launchActivity(area);
  const reviewMoves = moves.filter((move) => ['inaccuracy', 'mistake', 'blunder'].includes(move.classification));
  const workflowComplete = progress.activeSessionCompleted.includes('puzzles')
    && progress.activeSessionCompleted.includes('openings')
    && progress.activeSessionCompleted.includes('positional')
    && progress.activeSessionCompleted.includes('endgame')
    && progress.activeSessionCompleted.includes('game-review');

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-chess-border pb-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-chess-accent"><BrainCircuit className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Phase 10 · Coach</span></div>
          <h2 className="text-xl font-extrabold text-white">AI Chess Coach</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Metric label="Daily sessions" value={progress.dailySessions} />
          <Metric label="Training time" value={formatDuration(progress.totalTrainingSeconds)} />
          <Metric label="Daily streak" value={`${progress.currentDailyStreak} / ${progress.bestDailyStreak}`} />
          <Metric label="Accuracy change" value={accuracyChange(progress.accuracyHistory, totalAccuracy)} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricTile icon={<Activity className="h-4 w-4" />} label="Overall accuracy" value={`${totalAccuracy}%`} detail={`${totalSolved} / ${totalAttempted} solved`} />
        <MetricTile icon={<Sparkles className="h-4 w-4" />} label="Puzzle accuracy" value={`${puzzleStats.attempted ? Math.round(puzzleStats.solved / puzzleStats.attempted * 100) : 0}%`} detail={`${puzzleStats.solved} puzzles solved`} />
        <MetricTile icon={<Target className="h-4 w-4" />} label="Current / best streak" value={`${currentStreak} / ${bestStreak}`} detail={`${totalPositionsSolved} positions solved`} />
        <MetricTile icon={<Trophy className="h-4 w-4" />} label="Training score" value={totalScore} detail={`Coach accuracy ${totalAccuracy}%`} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <section className="rounded-lg border border-chess-border bg-chess-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div><h3 className="text-sm font-bold text-gray-100">Training progress</h3><p className="mt-0.5 text-[10px] text-gray-500">Aggregated from saved activity in each training area</p></div>
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <div className="space-y-3">
              {metrics.map((metric) => (
                <div key={metric.area} className="grid grid-cols-[92px_minmax(0,1fr)_66px] items-center gap-2 text-xs">
                  <span className="text-gray-300">{metric.label}</span>
                  <div className="h-1.5 overflow-hidden rounded bg-chess-bg"><div className="h-full bg-chess-accent transition-[width]" style={{ width: `${metric.accuracy}%` }} /></div>
                  <span className="text-right font-mono text-gray-400">{metric.accuracy}% · {metric.solved}/{metric.attempted}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-chess-border bg-chess-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-bold text-gray-100">Personalized recommendation</h3><p className="mt-0.5 text-[10px] text-gray-500">Based on your saved training accuracy</p></div>
              <Lightbulb className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-chess-accent/30 bg-chess-surface p-3">
              <div><p className="text-xs font-bold text-cyan-100">{recommendation.label}</p><p className="mt-1 text-xs leading-relaxed text-gray-400">{recommendation.reason}</p><p className="mt-1 text-[10px] text-gray-500">{recommendation.area === 'puzzles' ? `Automatic puzzle level: ${recommendation.puzzleDifficulty}.` : 'Puzzle intensity adjusts automatically from recent puzzle performance.'}</p></div>
              <button onClick={() => jumpToRecommendation(recommendation.area)} className="inline-flex shrink-0 items-center gap-1.5 rounded border border-chess-accent bg-chess-accent px-3 py-2 text-xs font-bold text-white"><ArrowRight className="h-3.5 w-3.5" /> Practice</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Weak training areas">
              {weakAreas.length ? weakAreas.slice(0, 3).map((area) => <span key={area.area} className="rounded border border-amber-900/60 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-100">{area.label} · {area.accuracy}%</span>) : <span className="text-[10px] text-gray-500">No measured weak area yet. Start with puzzles to build a baseline.</span>}
            </div>
          </section>

          <section className="rounded-lg border border-chess-border bg-chess-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="text-sm font-bold text-gray-100">Daily Training</h3><p className="mt-0.5 text-[10px] text-gray-500">The coach picks the next unfinished activity from your weakest area</p></div>
              <span className="text-[10px] text-gray-500">{progress.activeSessionCompleted.length}/5 complete</span>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {(['puzzles', 'openings', 'positional', 'endgame', 'game-review'] as CoachArea[]).map((area) => (
                <div key={area} className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-[10px] ${progress.activeSessionCompleted.includes(area) ? 'border-emerald-900 bg-emerald-950/20 text-emerald-200' : 'border-chess-border bg-chess-surface text-gray-400'}`}>
                  {progress.activeSessionCompleted.includes(area) ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current" />}{areaLabel[area]}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-400">{workflowComplete ? 'Daily plan complete. Nice work.' : nextActivity ? `Next useful activity: ${areaLabel[nextActivity]}` : 'Start a focused daily session.'}</p>
              {workflowComplete ? (
                <button onClick={finishDailyTraining} disabled={progress.activeSessionStartedAt === null} className="inline-flex items-center gap-1.5 rounded border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-40"><Check className="h-3.5 w-3.5" /> Finish Training</button>
              ) : progress.activeSessionStartedAt ? (
                <button onClick={() => nextActivity && launchActivity(nextActivity)} disabled={!nextActivity} className="inline-flex items-center gap-1.5 rounded border border-chess-accent bg-chess-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /> Continue Daily Training</button>
              ) : (
                <button onClick={startDailyTraining} className="inline-flex items-center gap-1.5 rounded border border-chess-accent bg-chess-accent px-3 py-2 text-xs font-bold text-white"><Play className="h-3.5 w-3.5" /> Start Training</button>
              )}
            </div>
          </section>

          <section id="coach-game-review" className="scroll-mt-24 rounded-lg border border-chess-border bg-chess-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-gray-100">Game Review</h3><p className="mt-0.5 text-[10px] text-gray-500">Paste a completed PGN for move-by-move Stockfish analysis</p></div><Activity className="h-4 w-4 text-chess-accent" /></div>
            <textarea value={pgn} onChange={(event) => setPgn(event.target.value)} rows={4} aria-label="Completed game PGN" placeholder={'[Event "Casual game"]\n\n1. e4 e5 2. Nf3 Nc6 ...'} className="w-full resize-y rounded border border-chess-border bg-chess-bg p-3 font-mono text-xs text-gray-200 placeholder:text-gray-600 focus:border-chess-accent focus:outline-none" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {analysisStatus === 'loading' ? <span className="text-[10px] text-cyan-200">Stockfish analyzing {analysisProgress.completed}/{analysisProgress.total} moves</span> : <span className="text-[10px] text-gray-500">Analysis uses the bundled Stockfish engine at depth 12.</span>}
              <button onClick={analysisStatus === 'loading' ? cancelAnalysis : beginGameReview} disabled={analysisStatus !== 'loading' && !pgn.trim()} className="inline-flex items-center gap-1.5 rounded border border-chess-accent bg-chess-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{analysisStatus === 'loading' ? <X className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}{analysisStatus === 'loading' ? 'Cancel Review' : 'Review with Stockfish'}</button>
            </div>
            {(reviewInputError || analysisError) && <p className="mt-2 rounded border border-rose-900 bg-rose-950/30 p-2 text-xs text-rose-200" role="alert">{reviewInputError || analysisError}</p>}
            {analysisStatus === 'loading' && <div className="mt-2 h-1.5 overflow-hidden rounded bg-chess-bg"><div className="h-full bg-chess-accent" style={{ width: `${analysisProgress.total ? analysisProgress.completed / analysisProgress.total * 100 : 0}%` }} /></div>}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-chess-border bg-chess-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-gray-100">Recent training activity</h3><Clock3 className="h-4 w-4 text-chess-accent" /></div>
            {progress.activities.length ? <div className="divide-y divide-chess-border/60">{progress.activities.slice(0, 8).map((activity, index) => <div key={`${activity.id}-${index}`} className="flex items-start justify-between gap-2 py-2"><div><p className="text-xs text-gray-200">{areaLabel[activity.label as CoachArea] || activity.label}</p><p className="mt-0.5 text-[10px] text-gray-500">{activity.detail}</p></div><time className="shrink-0 text-[9px] text-gray-600">{new Date(activity.at).toLocaleDateString()}</time></div>)}</div> : <p className="text-xs text-gray-500">Complete a training activity to build your recent history.</p>}
          </section>
          {reviewSummary && analysisStatus === 'completed' && (
            <section className="space-y-3 rounded-lg border border-chess-border bg-chess-card p-4">
              <div><h3 className="text-sm font-bold text-gray-100">Game summary</h3><p className="mt-0.5 text-xs text-gray-400">Overall accuracy {reviewSummary.overallAccuracy}% · {moves.length} moves reviewed by Stockfish</p></div>
              <div className="grid grid-cols-3 gap-1.5">{[['Blunders', reviewSummary.blunders], ['Mistakes', reviewSummary.mistakes], ['Inaccuracies', reviewSummary.inaccuracies], ['Best moves', reviewSummary.bestMoves], ['Missed chances', reviewSummary.missedOpportunities]].map(([label, value]) => <Metric key={label} label={String(label)} value={Number(value)} />)}</div>
              {moves.some((move) => move.classification === 'best') && <div><h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Best moves</h4><p className="font-mono text-xs text-emerald-200">{moves.filter((move) => move.classification === 'best').slice(0, 8).map((move) => `${move.moveNumber}${move.color === 'w' ? '.' : '...'} ${move.playedMoveSan}`).join(' · ')}</p></div>}
              <div className="grid grid-cols-3 gap-1.5">{(['opening', 'middlegame', 'endgame'] as const).map((phase) => <Metric key={phase} label={`${phase} accuracy`} value={reviewSummary.phaseAccuracy[phase] === null ? '—' : `${reviewSummary.phaseAccuracy[phase]}%`} />)}</div>
              {reviewMoves.length > 0 ? <div className="max-h-[380px] space-y-2 overflow-y-auto">{reviewMoves.map((move) => <MistakeExplanation key={move.nodeId} move={move} explanation={explainGameAnalysisMove(move)} />)}</div> : <p className="rounded border border-emerald-900 bg-emerald-950/20 p-2 text-xs text-emerald-200">No inaccuracies, mistakes, or blunders were found in the analyzed moves.</p>}
              <div className="space-y-1.5 border-t border-chess-border pt-3"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recommended next</p>{reviewSummary.recommendations.map((item) => <button key={item.area} onClick={() => jumpToRecommendation(item.area)} className="flex w-full items-center justify-between gap-2 rounded border border-chess-border bg-chess-surface px-2.5 py-2 text-left"><span><span className="block text-xs font-semibold text-gray-200">{item.label}</span><span className="mt-0.5 block text-[10px] text-gray-500">{item.reason}</span></span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-chess-accent" /></button>)}</div>
            </section>
          )}
          {analysisStatus === 'completed' && points.length > 0 && <p className="flex items-center gap-1.5 text-[10px] text-emerald-300"><Check className="h-3 w-3" /> Review #{reviewedGameCount} is based on Stockfish’s completed search results.</p>}
        </aside>
      </section>
    </div>
  );
};

function clearPendingActivity(current: CoachProgress, area: CoachArea, currentCount: number): CoachProgress {
  return {
    ...completeCoachActivity({ ...current, pendingActivity: null, pendingActivityBaseline: null }, area, `Progress recorded (${currentCount - (current.pendingActivityBaseline || 0)} new attempts)`, Date.now()),
  };
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const accuracyChange = (history: CoachProgress['accuracyHistory'], currentAccuracy: number) => {
  if (history.length < 2) return '—';
  const difference = currentAccuracy - history[0].accuracy;
  return `${difference > 0 ? '+' : ''}${difference} pts`;
};

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => <div className="min-w-0 rounded border border-chess-border bg-chess-surface px-2 py-2"><div className="truncate text-[9px] text-gray-500">{label}</div><div className="mt-0.5 font-mono text-xs font-bold text-gray-100">{value}</div></div>;

const MetricTile: React.FC<{ icon: React.ReactNode; label: string; value: string | number; detail: string }> = ({ icon, label, value, detail }) => (
  <div className="flex min-w-0 items-center gap-2 rounded-lg border border-chess-border bg-chess-card px-3 py-2.5"><span className="shrink-0 text-chess-accent">{icon}</span><div className="min-w-0"><div className="truncate text-[10px] text-gray-500">{label}</div><div className="font-mono text-sm font-bold text-gray-100">{value}</div><div className="truncate text-[9px] text-gray-600">{detail}</div></div></div>
);

const MistakeExplanation: React.FC<{ move: GameAnalysisMove; explanation: string }> = ({ move, explanation }) => (
  <details open className="rounded border border-amber-900/50 bg-amber-950/10 px-2.5 py-2"><summary className="cursor-pointer text-xs text-gray-200">{move.moveNumber}{move.color === 'w' ? '.' : '...'} {move.playedMoveSan} · {move.classification} · {Math.round(move.centipawnLoss)} cp lost <span className="font-mono text-cyan-200">(best: {move.bestMoveSan})</span></summary><p className="mt-2 text-[10px] leading-relaxed text-gray-300">{explanation}</p></details>
);
