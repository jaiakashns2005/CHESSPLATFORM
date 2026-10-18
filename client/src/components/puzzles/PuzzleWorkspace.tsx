import React, { useMemo, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { Activity, ArrowRight, Award, Check, Clock3, Flame, Lightbulb, RotateCcw, SkipForward, Sparkles, Target, Trophy, X } from 'lucide-react';
import { ChessBoard } from '../board/ChessBoard';
import { usePuzzleTraining } from '../../hooks/usePuzzleTraining';
import { BoardTheme, ChessSquare, PieceType } from '../../types/chess';

interface PuzzleWorkspaceProps {
  currentTheme: BoardTheme;
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const PuzzleWorkspace: React.FC<PuzzleWorkspaceProps> = ({ currentTheme }) => {
  const [pendingPromotion, setPendingPromotion] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const {
    puzzle,
    fen,
    turn,
    isCheck,
    selectedSquare,
    legalMoves,
    lastMove,
    orientation,
    status,
    message,
    hintLevel,
    remainingSeconds,
    stats,
    accuracy,
    engineStatus,
    engineError,
    engineResult,
    isGenerating,
    solutionLine,
    handleSquareClick,
    handleDropMove,
    requestHint,
    nextPuzzle,
    retryPuzzle,
    skipPuzzle,
    showSolution,
    flipBoard,
  } = usePuzzleTraining();

  const currentEngineMove = useMemo(() => {
    if (!engineResult?.bestMove) return null;
    try {
      const game = new Chess(puzzle.fen);
      const uci = engineResult.bestMove;
      return game.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] })?.san || uci;
    } catch {
      return engineResult.bestMove;
    }
  }, [engineResult, puzzle.fen]);

  const onSquareClick = (square: ChessSquare) => {
    if (selectedSquare && legalMoves.includes(square)) {
      const currentBoard = new Chess(fen);
      const piece = currentBoard.get(selectedSquare as Square);
      if (piece?.type === 'p' && (square[1] === '1' || square[1] === '8')) {
        setPendingPromotion({ from: selectedSquare, to: square });
        return;
      }
    }
    handleSquareClick(square);
  };

  const onConfirmPromotion = (promotion: PieceType) => {
    if (pendingPromotion) handleDropMove(pendingPromotion.from, pendingPromotion.to, promotion);
    setPendingPromotion(null);
  };

  const onDrop = (from: ChessSquare, to: ChessSquare) => {
    const board = new Chess(fen);
    const piece = board.get(from as Square);
    if (piece?.type === 'p' && (to[1] === '1' || to[1] === '8')) {
      setPendingPromotion({ from, to });
      return;
    }
    handleDropMove(from, to);
  };

  const statusClass = status === 'completed'
    ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
    : status === 'failed'
      ? 'border-rose-800 bg-rose-950/40 text-rose-200'
      : message.startsWith('Correct')
        ? 'border-cyan-800 bg-cyan-950/40 text-cyan-100'
        : 'border-chess-border bg-chess-surface text-gray-300';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-chess-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-chess-accent mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Phase 6 · Continuous session</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Tactics & Puzzles</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatTile icon={<Target className="w-4 h-4" />} label="Attempted" value={stats.attempted} />
        <StatTile icon={<Check className="w-4 h-4" />} label="Solved" value={stats.solved} />
        <StatTile icon={<Flame className="w-4 h-4" />} label="Accuracy" value={`${accuracy}%`} />
        <StatTile icon={<Trophy className="w-4 h-4" />} label="Score / Streak" value={`${stats.score} / ${stats.currentStreak}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] gap-5 items-start">
        <section className="min-w-0">
          <div className="w-full max-w-[640px] mx-auto flex items-stretch gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <ChessBoard
                fen={fen}
                turn={turn}
                orientation={orientation}
                theme={currentTheme}
                selectedSquare={selectedSquare}
                legalMoves={legalMoves}
                lastMove={lastMove}
                pendingPromotion={pendingPromotion ? { ...pendingPromotion, color: puzzle.playerColor } : null}
                isCheck={isCheck}
                isGameOver={status !== 'playing' || turn !== puzzle.playerColor || isGenerating}
                onSquareClick={onSquareClick}
                onDropMove={onDrop}
                onConfirmPromotion={onConfirmPromotion}
                onCancelPromotion={() => setPendingPromotion(null)}
              />
            </div>
          </div>
          <div className="max-w-[640px] mx-auto flex items-center justify-between gap-2 pt-2">
            <span className="text-[10px] text-gray-500">{puzzle.playerColor === 'w' ? 'White' : 'Black'} to solve</span>
            <button onClick={flipBoard} className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded border border-chess-border bg-chess-card">Flip board</button>
          </div>
        </section>

        <aside className="min-w-0 space-y-3">
          <div className="bg-chess-card border border-chess-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-chess-surface border-b border-chess-border flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-chess-accent">{puzzle.theme}</p>
                <h3 className="text-sm font-bold text-gray-100 mt-0.5">{puzzle.title}</h3>
              </div>
              <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${remainingSeconds <= 10 ? 'text-rose-300' : 'text-gray-100'}`}>
                <Clock3 className="w-4 h-4" /> {formatTime(remainingSeconds)}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className={`rounded-md border px-3 py-2.5 text-xs leading-relaxed ${statusClass}`} role="status" aria-live="polite">
                {message}
              </div>

              {hintLevel > 0 && status === 'playing' && (
                <div className="flex gap-2 text-xs text-amber-200 bg-amber-950/30 border border-amber-900/60 rounded p-2.5">
                  <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{message}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={requestHint} disabled={status !== 'playing' || hintLevel >= 3 || isGenerating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-amber-800/70 bg-amber-950/30 text-amber-200 text-xs font-semibold hover:bg-amber-950/60 disabled:opacity-40">
                  <Lightbulb className="w-3.5 h-3.5" /> Hint {hintLevel > 0 ? `${hintLevel}/3` : ''}
                </button>
                <button onClick={showSolution} disabled={status !== 'playing' || isGenerating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-chess-border bg-chess-surface text-gray-300 text-xs font-semibold hover:text-white disabled:opacity-40">
                  <Award className="w-3.5 h-3.5" /> Show solution
                </button>
                <button onClick={retryPuzzle} disabled={isGenerating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-chess-border bg-chess-surface text-gray-300 text-xs font-semibold hover:text-white disabled:opacity-40">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
                {status === 'playing' ? (
                  <button onClick={skipPuzzle} disabled={isGenerating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-chess-border bg-chess-surface text-gray-300 text-xs font-semibold hover:text-white disabled:opacity-40">
                    <SkipForward className="w-3.5 h-3.5" /> Skip Puzzle
                  </button>
                ) : (
                  <button onClick={() => nextPuzzle()} disabled={isGenerating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-chess-accent bg-chess-accent text-white text-xs font-bold hover:brightness-110 disabled:opacity-60">
                    <ArrowRight className="w-3.5 h-3.5" /> {isGenerating ? 'Finding puzzle…' : 'Next Puzzle'}
                  </button>
                )}
              </div>

              {isGenerating && <p className="text-[10px] text-cyan-200" role="status">Stockfish is validating a fresh legal position…</p>}

              {(status === 'completed' || status === 'failed') && (
                <div className="border-t border-chess-border pt-3 space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
                    <span>Theme: <strong className="text-gray-200">{puzzle.theme}</strong></span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Solution</p>
                  <p className="font-mono text-sm font-bold text-cyan-200">{solutionLine}</p>
                  <p className="text-xs leading-relaxed text-gray-300">{puzzle.explanation}</p>
                  <div className="flex items-center justify-between gap-2 text-[10px] border border-chess-border rounded bg-chess-bg px-2.5 py-2">
                    <span className="flex items-center gap-1.5 text-gray-400"><Activity className="w-3.5 h-3.5 text-chess-accent" /> Stockfish {engineStatus === 'error' ? 'unavailable' : engineResult ? `depth ${engineResult.evaluation?.depth ?? 12}` : 'analyzing position...'}</span>
                    {engineResult && <span className="font-mono text-gray-200">{currentEngineMove || 'No legal move'} {engineResult.evaluation?.scoreDisplay || ''}</span>}
                  </div>
                  {engineError && <p className="text-[10px] text-rose-300 flex items-center gap-1"><X className="w-3 h-3" /> {engineError}</p>}
                </div>
              )}

              {status === 'playing' && (
                <p className="text-[10px] text-gray-500">Select a piece and destination, or drag it. Only legal moves can be played.</p>
              )}
            </div>
          </div>

          <div className="bg-chess-card border border-chess-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Training Progress</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <ProgressValue label="Puzzles attempted" value={stats.attempted} />
              <ProgressValue label="Puzzles solved" value={stats.solved} />
              <ProgressValue label="Accuracy" value={`${accuracy}%`} />
              <ProgressValue label="Current streak" value={stats.currentStreak} />
              <ProgressValue label="Best streak" value={stats.bestStreak} />
              <ProgressValue label="Total score" value={stats.score} />
            </div>
            <div className="mt-3 h-1.5 rounded bg-chess-bg overflow-hidden">
              <div className="h-full bg-emerald-400 transition-[width]" style={{ width: `${accuracy}%` }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="min-w-0 flex items-center gap-2.5 bg-chess-card border border-chess-border rounded-lg px-3 py-2.5">
    <span className="text-chess-accent shrink-0">{icon}</span>
    <div className="min-w-0"><div className="text-[10px] text-gray-500 truncate">{label}</div><div className="text-sm font-bold font-mono text-gray-100 truncate">{value}</div></div>
  </div>
);

const ProgressValue: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2"><span className="text-gray-500">{label}</span><span className="font-mono font-bold text-gray-100">{value}</span></div>
);