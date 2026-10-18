import React from 'react';
import { PieceColor, TimeControl } from '../../types/chess';
import { formatClockTime } from '../../utils/timeUtils';
import { Clock, Flame } from 'lucide-react';

interface ChessClockProps {
  color: PieceColor;
  timeMs: number;
  isActive: boolean;
  timeControl: TimeControl;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  timeMs,
  isActive,
  timeControl,
}) => {
  if (timeControl.isUnlimited) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-chess-bg/80 border border-chess-border text-xs font-mono text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        <span>Casual (∞)</span>
      </div>
    );
  }

  const isLowTime = timeMs <= 10000;
  const isCritical = timeMs <= 5000;

  let bgClass = 'bg-chess-bg border-chess-border text-gray-300';

  if (isActive) {
    if (isLowTime) {
      bgClass = 'bg-rose-950 border-rose-600 text-rose-200 ring-2 ring-rose-500/50 animate-pulse';
    } else {
      bgClass = 'bg-chess-surface border-chess-accent text-white ring-2 ring-chess-accent/40';
    }
  } else if (isLowTime) {
    bgClass = 'bg-rose-950/40 border-rose-800/60 text-rose-300';
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wider transition-all select-none shadow-sm ${bgClass}`}
    >
      {isCritical ? (
        <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
      ) : (
        <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-chess-accent' : 'text-gray-400'}`} />
      )}
      <span className="tabular-nums">{formatClockTime(timeMs)}</span>
    </div>
  );
};
