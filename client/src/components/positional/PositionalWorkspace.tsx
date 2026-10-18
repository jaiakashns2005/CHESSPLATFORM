import React, { useMemo, useState } from 'react';
import { Activity, AlertCircle, Check, CircleHelp, Crosshair, Lightbulb, LoaderCircle, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react';
import { ChessBoard } from '../board/ChessBoard';
import { POSITIONAL_CHALLENGES } from '../../core/positional/positionCatalog';
import { positionalAccuracy } from '../../core/positional/positionalProgress';
import { usePositionalTraining } from '../../hooks/usePositionalTraining';
import { BoardTheme } from '../../types/chess';
import { PositionalCategory, PositionalChallenge, PositionalDifficulty } from '../../types/positional';

interface PositionalWorkspaceProps {
  currentTheme: BoardTheme;
}

const DIFFICULTIES: { id: PositionalDifficulty; label: string; depth: number }[] = [
  { id: 'beginner', label: 'Beginner', depth: 10 },
  { id: 'intermediate', label: 'Intermediate', depth: 13 },
  { id: 'advanced', label: 'Advanced', depth: 16 },
];

const ALL_CATEGORIES = 'All Categories';

export const PositionalWorkspace: React.FC<PositionalWorkspaceProps> = ({ currentTheme }) => {
  const [difficulty, setDifficulty] = useState<PositionalDifficulty>('beginner');
  const [categoryFilter, setCategoryFilter] = useState<typeof ALL_CATEGORIES | PositionalCategory>(ALL_CATEGORIES);
  const positionPool = useMemo(() => POSITIONAL_CHALLENGES.filter((item) =>
    item.difficulty === difficulty && (categoryFilter === ALL_CATEGORIES || item.category === categoryFilter)), [categoryFilter, difficulty]);
  const initialChallenge = POSITIONAL_CHALLENGES.find((challenge) => challenge.difficulty === 'beginner') || POSITIONAL_CHALLENGES[0];
  const [challenge, setChallenge] = useState<PositionalChallenge>(initialChallenge);
  const [hintVisible, setHintVisible] = useState(false);
  const training = usePositionalTraining(challenge, difficulty);

  const categories = useMemo(() => [...new Set(POSITIONAL_CHALLENGES.map((item) => item.category))], []);
  const [positionCursor, setPositionCursor] = useState(0);

  const selectDifficulty = (nextDifficulty: PositionalDifficulty) => {
    setDifficulty(nextDifficulty);
    setHintVisible(false);
    let nextPool = POSITIONAL_CHALLENGES.filter((item) => item.difficulty === nextDifficulty && (categoryFilter === ALL_CATEGORIES || item.category === categoryFilter));
    if (nextPool.length === 0) {
      setCategoryFilter(ALL_CATEGORIES);
      nextPool = POSITIONAL_CHALLENGES.filter((item) => item.difficulty === nextDifficulty);
    }
    if (nextPool.length > 0) {
      setPositionCursor(0);
      setChallenge(nextPool[0]);
    } else {
      setCategoryFilter(ALL_CATEGORIES);
      const first = POSITIONAL_CHALLENGES.find((item) => item.difficulty === nextDifficulty);
      if (first) setChallenge(first);
      setPositionCursor(0);
    }
  };

  const selectCategory = (value: string) => {
    const nextCategory = value === ALL_CATEGORIES ? ALL_CATEGORIES : value as PositionalCategory;
    setCategoryFilter(nextCategory);
    setHintVisible(false);
    const next = POSITIONAL_CHALLENGES.find((item) => item.difficulty === difficulty && (nextCategory === ALL_CATEGORIES || item.category === nextCategory))
      || POSITIONAL_CHALLENGES.find((item) => nextCategory === ALL_CATEGORIES || item.category === nextCategory);
    if (next) {
      setDifficulty(next.difficulty);
      setPositionCursor(0);
      setChallenge(next);
    }
  };

  const nextPosition = () => {
    if (positionPool.length === 0) return;
    const currentIndex = positionPool.findIndex((item) => item.id === challenge.id);
    const nextIndex = currentIndex < 0 ? positionCursor % positionPool.length : (currentIndex + 1) % positionPool.length;
    setPositionCursor(nextIndex + 1);
    setChallenge(positionPool[nextIndex]);
    setHintVisible(false);
  };

  const requestHint = () => {
    training.showHint();
    setHintVisible(true);
  };

  const lineAccuracy = positionalAccuracy(training.categoryProgress.attempted, training.categoryProgress.solved);
  const overallAccuracy = positionalAccuracy(training.progress.attempted, training.progress.solved);
  const statusClass = training.status === 'solved'
    ? 'border-emerald-800 bg-emerald-950/35 text-emerald-200'
    : training.status === 'failed'
      ? 'border-amber-800 bg-amber-950/35 text-amber-200'
      : 'border-chess-border bg-chess-surface text-gray-300';

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-chess-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-chess-accent mb-1">
            <Crosshair className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Phase 8 Training</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Positional Training</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Stat label="Attempted" value={training.progress.attempted} />
          <Stat label="Solved" value={training.progress.solved} />
          <Stat label="Accuracy" value={`${overallAccuracy}%`} />
          <Stat label="Streak" value={`${training.progress.currentStreak} / ${training.progress.bestStreak}`} />
          <Stat label="Score" value={training.score} />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg border border-chess-border bg-chess-card" aria-label="Positional difficulty">
          {DIFFICULTIES.map((option) => (
            <button
              key={option.id}
              onClick={() => selectDifficulty(option.id)}
              aria-pressed={difficulty === option.id}
              className={`px-3 py-1.5 rounded text-xs font-bold ${difficulty === option.id ? 'bg-chess-accent text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          Category
          <select
            aria-label="Positional category"
            value={categoryFilter}
            onChange={(event) => selectCategory(event.target.value)}
            className="max-w-[230px] bg-chess-card border border-chess-border rounded px-2.5 py-2 text-xs text-gray-200"
          >
            <option value={ALL_CATEGORIES}>{ALL_CATEGORIES}</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] gap-4 items-start">
        <section className="bg-chess-card border border-chess-border rounded-lg p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-chess-accent">{challenge.category} · {challenge.difficulty}</p>
              <h3 className="mt-0.5 text-base font-bold text-gray-100">{challenge.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={requestHint}
                disabled={!training.canPlay || training.status !== 'ready' || training.hintLevel >= 2}
                className="inline-flex items-center gap-1.5 rounded border border-amber-800/70 bg-amber-950/30 px-2.5 py-2 text-xs font-semibold text-amber-200 disabled:opacity-40"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Hint{training.hintLevel ? ` ${training.hintLevel}/2` : ''}
              </button>
              <button onClick={nextPosition} disabled={positionPool.length === 0} className="inline-flex items-center gap-1.5 rounded border border-chess-accent bg-chess-accent px-2.5 py-2 text-xs font-bold text-white disabled:opacity-40">
                <Sparkles className="w-3.5 h-3.5" /> New Position
              </button>
            </div>
          </div>

          <div className="max-w-[640px] mx-auto">
            <ChessBoard
              fen={training.boardFen}
              turn={training.turn}
              orientation={training.orientation}
              theme={currentTheme}
              selectedSquare={training.selectedSquare}
              legalMoves={training.legalMoves}
              lastMove={training.lastMove}
              pendingPromotion={null}
              isCheck={training.isCheck}
              isGameOver={!training.canPlay || training.status !== 'ready'}
              onSquareClick={training.handleSquareClick}
              onDropMove={training.handleDropMove}
              onConfirmPromotion={() => undefined}
              onCancelPromotion={() => undefined}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
            <span>{training.turn === 'w' ? 'White' : 'Black'} to move · Position from legal game sequence</span>
            <span className="flex items-center gap-1.5 font-mono">
              <Activity className="w-3.5 h-3.5 text-chess-accent" />
              {training.engineStatus === 'error' ? 'Stockfish error' : training.engineReady ? `Stockfish ready · depth ${training.engineDepth}` : `Stockfish analyzing · depth ${training.engineDepth}`}
            </span>
          </div>

          {hintVisible && training.status === 'ready' && <div className="rounded border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs leading-relaxed text-amber-100" role="status">{training.message}</div>}
          <div className={`flex items-start gap-2 rounded border px-3 py-2.5 text-xs leading-relaxed ${statusClass}`} role="status" aria-live="polite">
            {training.status === 'solved' ? <Check className="w-4 h-4 shrink-0" /> : training.status === 'failed' ? <CircleHelp className="w-4 h-4 shrink-0" /> : null}
            <span>{training.message}</span>
          </div>

          {training.engineError && <div className="flex items-center justify-between gap-2 rounded border border-rose-900 bg-rose-950/30 px-3 py-2 text-xs text-rose-200"><span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {training.engineError}</span><button onClick={training.restartEngine} className="font-bold underline">Retry engine</button></div>}

          {(training.status === 'solved' || training.status === 'failed') && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-chess-border pt-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Stockfish recommendation</p>
                <p className="font-mono text-sm font-bold text-cyan-200">{training.revealedMove?.san || training.engineBestMoveSan || 'No legal engine move'}</p>
                <p className="mt-1 text-xs text-gray-300">{challenge.explanation}</p>
                {training.evaluation && <p className="mt-1 text-[10px] text-gray-500">Challenge-position evaluation: {training.evaluation.scoreDisplay} at depth {training.evaluation.depth}</p>}
              </div>
              <button onClick={training.retry} className="inline-flex items-center gap-1.5 rounded border border-chess-border bg-chess-surface px-3 py-2 text-xs font-semibold text-gray-200"><RotateCcw className="w-3.5 h-3.5" /> Retry</button>
            </div>
          )}

          {!training.engineReady && !training.engineError && <p className="flex items-center gap-2 text-[10px] text-gray-500"><LoaderCircle className="w-3.5 h-3.5 animate-spin" /> Waiting for the real Stockfish result before enabling moves.</p>}
        </section>

        <aside className="space-y-3">
          <div className="bg-chess-card border border-chess-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-chess-accent" /><h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Training progress</h3></div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Positions attempted" value={training.progress.attempted} />
              <Metric label="Positions solved" value={training.progress.solved} />
              <Metric label="Accuracy" value={`${overallAccuracy}%`} />
              <Metric label="Current streak" value={training.progress.currentStreak} />
              <Metric label="Best streak" value={training.progress.bestStreak} />
              <Metric label="Score" value={training.score} />
              <Metric label={`${challenge.category} solved`} value={`${training.categoryProgress.solved}/${training.categoryProgress.attempted}`} />
              <Metric label="Category accuracy" value={`${lineAccuracy}%`} />
            </div>
          </div>

          <div className="bg-chess-card border border-chess-border rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Category progress</h3>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-chess-border/60">
              {POSITIONAL_CHALLENGES.map((item) => {
                const stats = training.progress.byCategory[item.category] || { attempted: 0, solved: 0 };
                return (
                  <button key={item.id} onClick={() => { setCategoryFilter(item.category); setDifficulty(item.difficulty); setChallenge(item); setHintVisible(false); }} className={`w-full flex items-center justify-between gap-2 py-2 text-left ${item.id === challenge.id ? 'text-chess-accent' : 'text-gray-300 hover:text-white'}`}>
                    <span className="min-w-0 truncate text-[10px]">{item.category}</span>
                    <span className="shrink-0 font-mono text-[10px] text-gray-500">{stats.solved}/{stats.attempted}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded border border-chess-border bg-chess-surface/60 p-3 text-xs text-gray-400">
            <p className="flex items-start gap-2"><CircleHelp className="w-4 h-4 shrink-0 text-chess-accent" /><span>Focus on the {challenge.category.toLowerCase()} idea. Request a hint when you want a nudge.</span></p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="min-w-[76px] rounded border border-chess-border bg-chess-card px-2.5 py-1.5">
    <div className="text-[9px] text-gray-500">{label}</div>
    <div className="font-mono text-xs font-bold text-gray-100">{value}</div>
  </div>
);

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="min-w-0 rounded border border-chess-border bg-chess-surface px-2.5 py-2">
    <div className="truncate text-[9px] text-gray-500">{label}</div>
    <div className="mt-0.5 font-mono text-xs font-bold text-gray-100">{value}</div>
  </div>
);