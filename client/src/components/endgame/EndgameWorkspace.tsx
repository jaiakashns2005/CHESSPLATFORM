import React, { useState } from 'react';
import { Activity, ArrowRight, Award, Check, CircleHelp, Clock3, Crown, Lightbulb, RotateCcw, Target, Trophy, X } from 'lucide-react';
import { Chess, Square } from 'chess.js';
import { ChessBoard } from '../board/ChessBoard';
import { useEndgameTraining } from '../../hooks/useEndgameTraining';
import { BoardTheme, ChessSquare, PieceType } from '../../types/chess';
import { ENDGAME_CATEGORIES } from '../../types/endgame';

interface EndgameWorkspaceProps {
  currentTheme: BoardTheme;
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const EndgameWorkspace: React.FC<EndgameWorkspaceProps> = ({ currentTheme }) => {
  const [pendingPromotion, setPendingPromotion] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const training = useEndgameTraining();
  const displayFen = training.boardFen;
  const currentEngineMove = training.engineResult?.bestMove
    ? (() => {
      try {
        const game = new Chess(training.challenge?.fen || displayFen);
        const uci = training.engineResult.bestMove;
        return game.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] })?.san || uci;
      } catch {
        return training.engineResult.bestMove;
      }
    })()
    : null;

  const onSquareClick = (square: ChessSquare) => {
    if (training.selectedSquare && training.legalMoves.includes(square)) {
      const piece = new Chess(displayFen).get(training.selectedSquare as Square);
      if (piece?.type === 'p' && (square[1] === '1' || square[1] === '8')) {
        setPendingPromotion({ from: training.selectedSquare, to: square });
        return;
      }
    }
    training.handleSquareClick(square);
  };

  const onDropMove = (from: ChessSquare, to: ChessSquare) => {
    const piece = new Chess(displayFen).get(from as Square);
    if (piece?.type === 'p' && (to[1] === '1' || to[1] === '8')) {
      setPendingPromotion({ from, to });
      return;
    }
    training.handleDropMove(from, to);
  };

  const statusClass = training.status === 'solved'
    ? 'border-emerald-800 bg-emerald-950/35 text-emerald-200'
    : training.status === 'failed'
      ? 'border-amber-800 bg-amber-950/35 text-amber-200'
      : 'border-chess-border bg-chess-surface text-gray-300';

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-chess-border pb-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-chess-accent">
            <Crown className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Phase 9 Training</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Endgame Training</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatTile icon={<Target className="h-4 w-4" />} label="Attempted" value={training.progress.attempted} />
          <StatTile icon={<Check className="h-4 w-4" />} label="Solved" value={training.progress.solved} />
          <StatTile icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${training.accuracy}%`} />
          <StatTile icon={<Crown className="h-4 w-4" />} label="Streak" value={`${training.progress.currentStreak} / ${training.progress.bestStreak}`} />
          <StatTile icon={<Trophy className="h-4 w-4" />} label="Score" value={training.progress.score} />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          Endgame category
          <select
            aria-label="Endgame category"
            value={training.selectedCategory}
            onChange={(event) => training.selectCategory(event.target.value as typeof training.selectedCategory)}
            className="max-w-[270px] rounded border border-chess-border bg-chess-card px-2.5 py-2 text-xs text-gray-200"
          >
            <option value={training.allCategoriesLabel}>{training.allCategoriesLabel}</option>
            {ENDGAME_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Activity className="h-3.5 w-3.5 text-chess-accent" />
          {training.engineError ? 'Stockfish error' : training.engineReady ? 'Stockfish validated' : 'Stockfish analyzing'}
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <section className="min-w-0">
          <div className="mx-auto w-full max-w-[640px]">
            <ChessBoard
              fen={displayFen}
              turn={training.currentTurn}
              orientation={training.orientation}
              theme={currentTheme}
              selectedSquare={training.selectedSquare}
              legalMoves={training.legalMoves}
              lastMove={training.lastMove}
              pendingPromotion={pendingPromotion && training.challenge ? { ...pendingPromotion, color: training.challenge.playerColor } : null}
              isCheck={training.isCheck}
              isGameOver={training.status !== 'playing' || !training.engineReady || training.isGenerating}
              onSquareClick={onSquareClick}
              onDropMove={onDropMove}
              onConfirmPromotion={(promotion: PieceType) => {
                if (pendingPromotion) training.handleDropMove(pendingPromotion.from, pendingPromotion.to, promotion);
                setPendingPromotion(null);
              }}
              onCancelPromotion={() => setPendingPromotion(null)}
            />
          </div>
          <div className="mx-auto flex max-w-[640px] items-center justify-between gap-2 pt-2 text-[10px] text-gray-500">
            <span>{training.currentTurn === 'w' ? 'White' : 'Black'} to move</span>
            <span>{training.challenge?.category || 'Preparing endgame position'}</span>
          </div>
        </section>

        <aside className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-lg border border-chess-border bg-chess-card">
            <div className="flex items-start justify-between gap-3 border-b border-chess-border bg-chess-surface px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-chess-accent">{training.challenge?.category || 'Endgame study'}</p>
                <h3 className="mt-0.5 text-sm font-bold text-gray-100">{training.challenge?.title || 'Finding a legal endgame…'}</h3>
              </div>
              <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${training.remainingSeconds <= 10 ? 'text-rose-300' : 'text-gray-100'}`}>
                <Clock3 className="h-4 w-4" /> {formatTime(training.remainingSeconds)}
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className={`rounded-md border px-3 py-2.5 text-xs leading-relaxed ${statusClass}`} role="status" aria-live="polite">{training.message}</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={training.requestHint} disabled={training.status !== 'playing' || !training.engineReady || training.hintLevel >= 2} className="inline-flex items-center gap-1.5 rounded border border-amber-800/70 bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-200 disabled:opacity-40">
                  <Lightbulb className="h-3.5 w-3.5" /> Hint {training.hintLevel ? `${training.hintLevel}/2` : ''}
                </button>
                <button onClick={training.showSolution} disabled={training.status !== 'playing' || !training.engineReady} className="inline-flex items-center gap-1.5 rounded border border-chess-border bg-chess-surface px-3 py-2 text-xs font-semibold text-gray-300 disabled:opacity-40">
                  <Award className="h-3.5 w-3.5" /> Show Solution
                </button>
                <button onClick={training.retry} disabled={!training.challenge || training.isGenerating} className="inline-flex items-center gap-1.5 rounded border border-chess-border bg-chess-surface px-3 py-2 text-xs font-semibold text-gray-300 disabled:opacity-40">
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </button>
                <button onClick={() => { setPendingPromotion(null); training.nextEndgame(); }} disabled={training.isGenerating} className="inline-flex items-center gap-1.5 rounded border border-chess-accent bg-chess-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                  <ArrowRight className="h-3.5 w-3.5" /> {training.isGenerating ? 'Finding Endgame…' : 'Next Endgame'}
                </button>
              </div>
              {training.isGenerating && <p className="text-[10px] text-cyan-200">Stockfish is checking a fresh legal endgame position…</p>}
              {training.engineError && <p className="flex items-center gap-1.5 text-[10px] text-rose-300"><X className="h-3 w-3" /> {training.engineError}</p>}

              {(training.status === 'solved' || training.status === 'failed') && training.challenge && (
                <div className="space-y-2 border-t border-chess-border pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Stockfish solution</p>
                  <p className="font-mono text-sm font-bold text-cyan-200">{training.challenge.solutionSan}</p>
                  <p className="text-xs leading-relaxed text-gray-300">{training.challenge.explanation}</p>
                  <div className="flex items-center justify-between gap-2 rounded border border-chess-border bg-chess-bg px-2.5 py-2 text-[10px]">
                    <span className="flex items-center gap-1.5 text-gray-400"><Activity className="h-3.5 w-3.5 text-chess-accent" /> Stockfish {training.engineStatus === 'error' ? 'unavailable' : `depth ${training.engineResult?.evaluation?.depth ?? 'analyzing'}`}</span>
                    <span className="font-mono text-gray-200">{currentEngineMove || training.challenge.solutionSan} {training.engineResult?.evaluation?.scoreDisplay || ''}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-chess-border bg-chess-card p-4">
            <div className="mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" /><h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Category progress</h3></div>
            <div className="max-h-[360px] divide-y divide-chess-border/60 overflow-y-auto">
              {training.categoryProgress.map(({ category, attempted, solved }) => (
                <button key={category} onClick={() => { setPendingPromotion(null); training.selectCategory(category); }} className={`flex w-full items-center justify-between gap-2 py-2 text-left ${training.challenge?.category === category ? 'text-chess-accent' : 'text-gray-300 hover:text-white'}`}>
                  <span className="min-w-0 truncate text-[10px]">{category}</span>
                  <span className="shrink-0 font-mono text-[10px] text-gray-500">{solved}/{attempted}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 rounded border border-chess-border bg-chess-surface/60 p-3 text-xs text-gray-400">
            <CircleHelp className="h-4 w-4 shrink-0 text-chess-accent" />
            <span>Find the strongest move for the selected endgame. Stockfish validates each generated position and answer.</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="flex min-w-0 items-center gap-2 rounded border border-chess-border bg-chess-card px-2.5 py-2">
    <span className="shrink-0 text-chess-accent">{icon}</span>
    <div className="min-w-0"><div className="truncate text-[9px] text-gray-500">{label}</div><div className="truncate font-mono text-xs font-bold text-gray-100">{value}</div></div>
  </div>
);
