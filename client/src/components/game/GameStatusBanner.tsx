import React from 'react';
import { GameResult, PieceColor } from '../../types/chess';
import { Award, CheckCircle2, ShieldAlert, Timer, Flag } from 'lucide-react';

interface GameStatusBannerProps {
  isCheck: boolean;
  turn: PieceColor;
  isGameOver: boolean;
  result: GameResult;
}

export const GameStatusBanner: React.FC<GameStatusBannerProps> = ({
  isCheck,
  turn,
  isGameOver,
  result,
}) => {
  if (!isCheck && !isGameOver) return null;

  if (isGameOver) {
    const isDraw = result.winner === 'draw';
    const isTimeout = result.reason === 'timeout' || result.reason === 'timeout_insufficient_material';
    const isResignation = result.reason === 'resignation';

    let icon = <Award className="w-6 h-6 text-emerald-400" />;
    if (isDraw) {
      icon = <CheckCircle2 className="w-6 h-6 text-amber-400" />;
    } else if (isTimeout) {
      icon = <Timer className="w-6 h-6 text-emerald-400" />;
    } else if (isResignation) {
      icon = <Flag className="w-6 h-6 text-emerald-400" />;
    }

    return (
      <div
        className={`w-full p-4 rounded-lg border flex items-center gap-3.5 shadow-lg animate-fade-in ${
          isDraw
            ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
            : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-100'
        }`}
      >
        <div className="p-2 rounded-full bg-white/10 shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-base tracking-wide">
            {isDraw ? 'Game Drawn' : `${result.winner === 'w' ? 'White' : 'Black'} is Victorious!`}
          </h4>
          <p className="text-xs opacity-90 mt-0.5">{result.message}</p>
        </div>
      </div>
    );
  }

  // Active check warning
  return (
    <div className="w-full p-3 rounded-lg border bg-rose-950/50 border-rose-600/60 text-rose-200 flex items-center gap-2.5 shadow-md animate-fade-in">
      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
      <div className="text-xs font-semibold">
        <span className="font-bold uppercase tracking-wider">{turn === 'w' ? 'White' : 'Black'}</span> is in Check!
      </div>
    </div>
  );
};
