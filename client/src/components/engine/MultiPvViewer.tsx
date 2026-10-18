import React from 'react';
import { EngineEvaluation } from '../../types/engine';
import { Play } from 'lucide-react';

interface MultiPvViewerProps {
  lines: EngineEvaluation[];
  onPlayMove?: (uci: string) => void;
}

export const MultiPvViewer: React.FC<MultiPvViewerProps> = ({ lines, onPlayMove }) => {
  if (lines.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-gray-500 italic">
        Awaiting engine calculation...
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {lines.map((line) => {
        const isMate = line.scoreMate !== undefined;

        // Score badge colors
        let badgeBg = 'bg-chess-surface text-gray-300 border-chess-border';
        if (isMate) {
          badgeBg = 'bg-purple-950/70 text-purple-300 border-purple-800';
        } else if (line.scoreCp !== undefined) {
          if (line.scoreCp >= 150) {
            badgeBg = 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
          } else if (line.scoreCp <= -150) {
            badgeBg = 'bg-rose-950/70 text-rose-300 border-rose-800';
          }
        }

        return (
          <div
            key={line.multipv}
            className="flex items-start gap-2 p-2 rounded-lg bg-chess-surface/60 border border-chess-border/60 hover:border-chess-border transition-colors text-xs"
          >
            {/* Rank badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-5 h-5 rounded-full bg-chess-card border border-chess-border flex items-center justify-center text-[10px] font-bold text-gray-400">
                {line.multipv}
              </span>

              {/* Evaluation score badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border ${badgeBg}`}
              >
                {line.scoreDisplay}
              </span>
            </div>

            {/* Move sequence in SAN */}
            <div className="flex-1 font-mono text-gray-300 leading-relaxed break-words text-[11px]">
              {line.pvSan && line.pvSan.length > 0 ? (
                line.pvSan.slice(0, 10).map((san, idx) => (
                  <span
                    key={idx}
                    className={`inline-block mr-1.5 ${
                      idx === 0
                        ? 'font-bold text-white bg-chess-accent/20 px-1 rounded text-chess-accent'
                        : 'text-gray-300'
                    }`}
                  >
                    {san}{' '}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 italic">Evaluating...</span>
              )}
            </div>

            {/* Quick Play First Move Button */}
            {onPlayMove && line.bestMoveUci && (
              <button
                onClick={() => onPlayMove(line.bestMoveUci!)}
                title={`Play ${line.bestMoveSan || line.bestMoveUci}`}
                className="shrink-0 p-1 text-gray-400 hover:text-chess-accent hover:bg-chess-card rounded border border-transparent hover:border-chess-border transition-colors"
              >
                <Play className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
