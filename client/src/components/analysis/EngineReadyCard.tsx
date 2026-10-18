import React from 'react';
import { Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export const EngineReadyCard: React.FC = () => {
  return (
    <div className="bg-chess-card border border-chess-border rounded-lg p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-chess-accent/20 text-chess-accent flex items-center justify-center border border-chess-accent/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-200 uppercase tracking-wider">Stockfish Engine</h4>
            <span className="text-[10px] text-gray-400">Stockfish WebAssembly available</span>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-chess-surface text-gray-300 border border-chess-border">
          Browser Engine
        </span>
      </div>

      <div className="p-3 bg-chess-surface/60 border border-chess-border/80 rounded-lg text-xs text-gray-300 space-y-1.5">
        <div className="flex items-center gap-1.5 text-chess-accent font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stockfish analysis is available:</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          The Analysis Board uses Stockfish WebAssembly for live evaluations, Multi-PV lines, best-move search, and completed-game review.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5 bg-chess-surface p-2 rounded border border-chess-border/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-chess-accent" />
          <span>Move Variations</span>
        </div>
        <div className="flex items-center gap-1.5 bg-chess-surface p-2 rounded border border-chess-border/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-chess-accent" />
          <span>Vector Drawing Tools</span>
        </div>
      </div>
    </div>
  );
};
