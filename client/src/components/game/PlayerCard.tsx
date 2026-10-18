import React from 'react';
import { PieceColor, PieceType, TimeControl } from '../../types/chess';
import { CapturedPieces } from '../board/CapturedPieces';
import { ChessClock } from '../clock/ChessClock';
import { User } from 'lucide-react';

interface PlayerCardProps {
  name: string;
  rating?: number;
  color: PieceColor;
  isTurn: boolean;
  capturedPieces: PieceType[];
  advantageDiff?: number;
  hasAdvantage?: boolean;
  timeMs: number;
  timeControl: TimeControl;
  isClockActive: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  rating = 1500,
  color,
  isTurn,
  capturedPieces,
  advantageDiff = 0,
  hasAdvantage = false,
  timeMs,
  timeControl,
  isClockActive,
}) => {
  const isWhite = color === 'w';

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-200 ${
        isTurn
          ? 'bg-chess-card border-chess-accent/60 shadow-md ring-1 ring-chess-accent/40'
          : 'bg-chess-surface border-chess-border/60'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-sm shadow-inner ${
            isWhite ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-gray-100 border border-gray-700'
          }`}
        >
          <User className="w-5 h-5" />
        </div>

        {/* Player Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-200">{name}</span>
            <span className="text-[11px] text-gray-400 font-mono bg-chess-bg px-1.5 py-0.5 rounded border border-chess-border">
              {rating}
            </span>
          </div>
          <div className="text-[11px] text-gray-400 capitalize">
            {color === 'w' ? 'White' : 'Black'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Captured pieces and advantage */}
        <div className="hidden sm:block">
          <CapturedPieces
            captured={capturedPieces}
            capturedPieceColor={isWhite ? 'b' : 'w'}
            advantageDiff={advantageDiff}
            hasAdvantage={hasAdvantage}
          />
        </div>

        {/* Chess Clock */}
        <ChessClock
          color={color}
          timeMs={timeMs}
          isActive={isClockActive}
          timeControl={timeControl}
        />
      </div>
    </div>
  );
};
