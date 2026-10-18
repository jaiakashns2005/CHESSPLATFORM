import React, { useState } from 'react';
import { EngineEvaluation, EngineSettings, EngineStatus } from '../../types/engine';
import { MultiPvViewer } from './MultiPvViewer';
import { Cpu, Settings, Play, Power, AlertCircle, RotateCcw } from 'lucide-react';

interface EnginePanelProps {
  status: EngineStatus;
  isAnalyzing: boolean;
  error: string | null;
  lines: EngineEvaluation[];
  topEvaluation: EngineEvaluation | null;
  currentDepth: number;
  bestMoveSan: string | null;
  bestMoveUci: string | null;
  settings: EngineSettings;
  onToggleEngine: () => void;
  onSetDepth: (depth: number) => void;
  onSetMultiPv: (multiPv: number) => void;
  onPlayMove: (uci: string) => void;
  onRestartEngine: () => void;
}

export const EnginePanel: React.FC<EnginePanelProps> = ({
  status,
  isAnalyzing,
  error,
  lines,
  topEvaluation,
  currentDepth,
  bestMoveSan,
  bestMoveUci,
  settings,
  onToggleEngine,
  onSetDepth,
  onSetMultiPv,
  onPlayMove,
  onRestartEngine,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-chess-card border border-chess-border rounded-lg p-3 space-y-3 shadow-lg">
      {/* Header with Engine Status & Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-chess-border/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-chess-accent/20 text-chess-accent flex items-center justify-center border border-chess-accent/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs text-gray-100 uppercase tracking-wider">
                Stockfish Engine
              </h4>
              {/* Status indicator dot */}
              <span
                className={`w-2 h-2 rounded-full ${
                  !settings.enabled
                    ? 'bg-gray-500'
                    : isAnalyzing
                    ? 'bg-cyan-400 animate-pulse ring-2 ring-cyan-400/40'
                    : status === 'ready'
                    ? 'bg-emerald-500'
                    : status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {!settings.enabled
                ? 'Engine Paused'
                : isAnalyzing
                ? (currentDepth > 0 ? `Analyzing (Depth ${currentDepth}/${settings.depth})` : 'Starting calculation...')
                : status === 'ready'
                ? (currentDepth > 0 ? `Ready (Depth ${currentDepth})` : 'Ready')
                : status === 'loading'
                ? 'Loading Stockfish Worker...'
                : status === 'error'
                ? 'Engine Error'
                : 'Offline'}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            title="Engine Settings"
            className={`p-1.5 rounded-lg border transition-colors ${
              showSettings
                ? 'bg-chess-surface border-chess-accent text-chess-accent'
                : 'bg-chess-surface text-gray-400 hover:text-gray-200 border-chess-border'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleEngine}
            title={settings.enabled ? 'Turn Engine Off' : 'Turn Engine On'}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              settings.enabled
                ? 'bg-chess-accent text-white border-chess-accent shadow-sm'
                : 'bg-chess-surface text-gray-400 border-chess-border hover:text-gray-200'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{settings.enabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-[11px] leading-tight">{error}</span>
          </div>
          <button
            onClick={onRestartEngine}
            className="px-2 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[10px] font-bold shrink-0 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && (
        <div className="p-3 bg-chess-surface rounded-lg border border-chess-border space-y-3 animate-fade-in text-xs">
          <div>
            <div className="flex justify-between items-center text-gray-300 font-semibold mb-1">
              <span>Calculation Depth</span>
              <span className="font-mono text-chess-accent">{settings.depth}</span>
            </div>
            <input
              type="range"
              min="10"
              max="25"
              step="1"
              value={settings.depth}
              onChange={(e) => onSetDepth(parseInt(e.target.value, 10))}
              className="w-full accent-chess-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>10 (Fast)</span>
              <span>18 (Standard)</span>
              <span>25 (Deep)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-gray-300 font-semibold mb-1">
              <span>Candidate Lines (Multi-PV)</span>
              <span className="font-mono text-chess-accent">{settings.multiPv}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => onSetMultiPv(count)}
                  className={`py-1 rounded text-xs font-mono font-bold border transition-colors ${
                    settings.multiPv === count
                      ? 'bg-chess-accent text-white border-chess-accent'
                      : 'bg-chess-card text-gray-300 border-chess-border hover:bg-chess-border'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Best Move Quick Action Banner */}
      {settings.enabled && bestMoveSan && bestMoveUci && (
        <div className="p-2.5 rounded-lg bg-chess-surface border border-cyan-500/30 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold text-xs">
              Best Move
            </div>
            <span className="font-mono font-extrabold text-sm text-white">{bestMoveSan}</span>
            {topEvaluation && (
              <span className="text-xs font-mono font-bold text-gray-300">
                ({topEvaluation.scoreDisplay})
              </span>
            )}
          </div>

          <button
            onClick={() => onPlayMove(bestMoveUci)}
            className="px-3 py-1.5 rounded-md bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Move</span>
          </button>
        </div>
      )}

      {/* Multi-PV Lines Table */}
      {settings.enabled ? (
        <MultiPvViewer lines={lines} onPlayMove={onPlayMove} />
      ) : (
        <div className="py-6 text-center text-xs text-gray-500 italic bg-chess-surface/40 rounded-lg border border-dashed border-chess-border">
          Engine evaluation is paused. Toggle ON to calculate position analysis.
        </div>
      )}
    </div>
  );
};
