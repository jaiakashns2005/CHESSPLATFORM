import React, { useMemo, useState } from 'react';
import { Activity, AlertCircle, AlertTriangle, Check, ChevronRight, LoaderCircle, Play, RotateCcw, Square, X } from 'lucide-react';
import { summarizeGameAnalysis } from '../../core/engine/gameAnalysis';
import { GameAnalysisMove, GameAnalysisStatus, GameEvaluationPoint } from '../../types/gameAnalysis';

interface GameAnalysisPanelProps {
  status: GameAnalysisStatus;
  error: string | null;
  moves: GameAnalysisMove[];
  points: GameEvaluationPoint[];
  progress: { completed: number; total: number };
  canAnalyze: boolean;
  onAnalyze: (depth: number) => void;
  onCancel: () => void;
  onSelectMove: (move: GameAnalysisMove) => void;
}

const classificationStyles: Record<GameAnalysisMove['classification'], string> = {
  best: 'text-emerald-300 bg-emerald-950/50',
  excellent: 'text-green-300 bg-green-950/50',
  good: 'text-sky-300 bg-sky-950/50',
  inaccuracy: 'text-amber-300 bg-amber-950/50',
  mistake: 'text-orange-300 bg-orange-950/50',
  blunder: 'text-rose-300 bg-rose-950/50',
  forced: 'text-gray-300 bg-gray-800',
};

const classificationLabel = (classification: GameAnalysisMove['classification']) =>
  classification === 'best' ? 'Best' : classification.charAt(0).toUpperCase() + classification.slice(1);

export const GameAnalysisPanel: React.FC<GameAnalysisPanelProps> = ({
  status,
  error,
  moves,
  points,
  progress,
  canAnalyze,
  onAnalyze,
  onCancel,
  onSelectMove,
}) => {
  const [depth, setDepth] = useState(12);
  const summary = useMemo(() => summarizeGameAnalysis(moves), [moves]);
  const isLoading = status === 'loading';

  const graph = useMemo(() => {
    if (points.length === 0) return null;
    const width = Math.max(320, points.length * 30);
    const height = 112;
    const padding = { x: 18, y: 14 };
    const maxAbs = Math.max(300, ...points.map((point) => Math.abs(point.scoreCp)));
    const y = (score: number) => padding.y + ((maxAbs - score) / (maxAbs * 2)) * (height - padding.y * 2);
    const x = (index: number) => padding.x + (points.length <= 1 ? 0 : index * (width - padding.x * 2) / (points.length - 1));
    return {
      width,
      height,
      zeroY: y(0),
      polyline: points.map((point, index) => `${x(index)},${y(point.scoreCp)}`).join(' '),
      coordinates: points.map((point, index) => ({ ...point, x: x(index), y: y(point.scoreCp) })),
    };
  }, [points]);

  return (
    <section className="bg-chess-card border border-chess-border rounded-lg overflow-hidden shadow-lg" aria-label="Game analysis">
      <header className="px-4 py-3 border-b border-chess-border bg-chess-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-chess-accent" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-100">Game Analysis</h3>
            <p className="text-[10px] text-gray-400">Stockfish review of the main game line</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <label className="flex items-center gap-1.5 text-[10px] text-gray-400">
              Depth
              <select
                aria-label="Game analysis depth"
                value={depth}
                onChange={(event) => setDepth(Number(event.target.value))}
                className="bg-chess-bg border border-chess-border rounded px-1.5 py-1 text-xs text-gray-100"
              >
                {[10, 12, 14, 16].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          )}
          {isLoading ? (
            <button onClick={onCancel} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-rose-800 bg-rose-950/60 text-rose-200 text-xs font-semibold">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          ) : (
            <button
              onClick={() => onAnalyze(depth)}
              disabled={!canAnalyze}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-chess-accent bg-chess-accent text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === 'completed' ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {status === 'completed' ? 'Analyze Again' : 'Analyze Game'}
            </button>
          )}
        </div>
      </header>

      <div className="p-3 sm:p-4 space-y-4">
        {isLoading && (
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="flex items-center gap-2"><LoaderCircle className="w-3.5 h-3.5 animate-spin text-chess-accent" /> Analyzing each position with Stockfish</span>
              <span className="font-mono">{progress.completed}/{progress.total}</span>
            </div>
            <div className="h-1.5 bg-chess-bg rounded overflow-hidden">
              <div className="h-full bg-chess-accent transition-[width]" style={{ width: `${progress.total ? progress.completed / progress.total * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded border border-rose-900 bg-rose-950/40 p-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /> {error}
          </div>
        )}

        {!canAnalyze && status !== 'loading' && status !== 'error' && (
          <p className="text-xs text-gray-400">Load a played game or PGN to start a move-by-move engine review.</p>
        )}

        {points.length > 0 && graph && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Evaluation by position</span>
              <span className="text-[10px] font-mono text-gray-500">White advantage above center</span>
            </div>
            <div className="overflow-x-auto border border-chess-border rounded bg-chess-bg/70">
              <svg width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} role="img" aria-label="Evaluation graph across the game" className="block min-w-full">
                <line x1="0" x2={graph.width} y1={graph.zeroY} y2={graph.zeroY} stroke="#6b7280" strokeDasharray="3 4" strokeOpacity="0.65" />
                <polyline points={graph.polyline} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {graph.coordinates.map((point, index) => (
                  <g key={`${point.position}-${point.nodeId || 'start'}`}>
                    <circle cx={point.x} cy={point.y} r="7" fill="transparent" onClick={() => point.nodeId && onSelectMove(moves[index - 1])} className={point.nodeId ? 'cursor-pointer' : ''} />
                    <circle cx={point.x} cy={point.y} r="2.5" fill="#a5f3fc" />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

        {moves.length > 0 && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <SummaryMetric label="White accuracy" value={`${summary.whiteAccuracy}%`} />
              <SummaryMetric label="Black accuracy" value={`${summary.blackAccuracy}%`} />
              <SummaryMetric label="Best moves" value={summary.bestMoves} />
              <SummaryMetric label="Inaccuracies" value={summary.inaccuracies} />
              <SummaryMetric label="Mistakes" value={summary.mistakes} />
              <SummaryMetric label="Blunders" value={summary.blunders} />
            </div>

            <div className="overflow-x-auto border border-chess-border rounded">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-[minmax(62px,0.65fr)_minmax(54px,0.55fr)_minmax(54px,0.55fr)_minmax(62px,0.65fr)_minmax(62px,0.65fr)_minmax(65px,0.65fr)_minmax(80px,0.8fr)] gap-1 px-2.5 py-2 bg-chess-surface text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  <span>Move</span><span>Before</span><span>After</span><span>Best</span><span>Played</span><span>Loss</span><span>Review</span>
                </div>
                <div className="max-h-[360px] overflow-y-auto divide-y divide-chess-border/60">
                  {moves.map((move, index) => {
                  const critical = move.classification === 'mistake' || move.classification === 'blunder';
                  return (
                    <button
                      key={`${move.nodeId}-${index}`}
                      onClick={() => onSelectMove(move)}
                      className={`w-full grid grid-cols-[minmax(62px,0.65fr)_minmax(54px,0.55fr)_minmax(54px,0.55fr)_minmax(62px,0.65fr)_minmax(62px,0.65fr)_minmax(65px,0.65fr)_minmax(80px,0.8fr)] gap-1 items-center px-2.5 py-2 text-left text-[10px] sm:text-xs hover:bg-chess-surface/80 ${critical ? 'bg-rose-950/10' : ''}`}
                    >
                      <span className="flex items-center gap-1 text-gray-300 font-mono whitespace-nowrap">
                        {critical && <AlertTriangle className={`w-3 h-3 ${move.classification === 'blunder' ? 'text-rose-400' : 'text-amber-400'}`} />}
                        {move.moveNumber}{move.color === 'w' ? '.' : '...'} {move.playedMoveSan}
                      </span>
                      <span className="font-mono text-gray-300">{move.evaluationBefore}</span>
                      <span className="font-mono text-gray-300">{move.evaluationAfter}</span>
                      <span className="font-mono text-cyan-200">{move.bestMoveSan}</span>
                      <span className="font-mono text-gray-100">{move.playedMoveSan}</span>
                      <span className={`font-mono ${move.centipawnLoss > 50 ? 'text-rose-300' : 'text-gray-400'}`}>{Math.round(move.centipawnLoss)} cp</span>
                      <span className={`justify-self-start px-1.5 py-0.5 rounded text-[9px] font-bold ${classificationStyles[move.classification]}`}>
                        {classificationLabel(move.classification)}
                      </span>
                    </button>
                  );
                  })}
                </div>
              </div>
            </div>

            {moves.some((move) => move.classification === 'mistake' || move.classification === 'blunder') && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Critical positions</h4>
                {moves.filter((move) => move.classification === 'mistake' || move.classification === 'blunder').map((move) => (
                  <button key={`critical-${move.nodeId}`} onClick={() => onSelectMove(move)} className="w-full flex flex-wrap items-center justify-between gap-2 p-2 rounded border border-rose-900/50 bg-rose-950/20 text-left hover:bg-rose-950/40">
                    <span className="text-xs text-gray-200">{move.moveNumber}{move.color === 'w' ? '.' : '...'} {move.playedMoveSan} <span className="text-gray-500">({move.classification}, {Math.round(move.centipawnLoss)} cp)</span></span>
                    <span className="flex items-center gap-1.5 text-xs text-cyan-200"><Check className="w-3 h-3" /> Best: {move.bestMoveSan} <ChevronRight className="w-3 h-3" /></span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {status === 'completed' && moves.length > 0 && <p className="text-[10px] text-emerald-300 flex items-center gap-1"><Check className="w-3 h-3" /> Analysis complete at the selected depth.</p>}
        {status === 'cancelled' && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Square className="w-2.5 h-2.5" /> Analysis cancelled. Partial results are retained.</p>}
      </div>
    </section>
  );
};

const SummaryMetric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="min-w-0 bg-chess-surface border border-chess-border rounded px-2 py-1.5">
    <div className="text-[9px] text-gray-500 truncate">{label}</div>
    <div className="text-xs font-bold font-mono text-gray-100">{value}</div>
  </div>
);