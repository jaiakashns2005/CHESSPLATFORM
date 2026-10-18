import React from 'react';
import { PieceType, PieceColor } from '../../types/chess';
import { renderPiece } from '../../assets/pieces';

interface CapturedPiecesProps {
  captured: PieceType[]; // Pieces this player has captured (opponent's color)
  capturedPieceColor: PieceColor;
  advantageDiff?: number;
  hasAdvantage?: boolean;
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  captured,
  capturedPieceColor,
  advantageDiff = 0,
  hasAdvantage = false,
}) => {
  if (captured.length === 0 && (!hasAdvantage || advantageDiff === 0)) {
    return <div className="h-7 flex items-center text-xs text-gray-500 italic">No pieces captured</div>;
  }

  // Count piece occurrences
  const counts: Partial<Record<PieceType, number>> = {};
  captured.forEach((p) => {
    counts[p] = (counts[p] || 0) + 1;
  });

  const order: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

  return (
    <div className="h-7 flex items-center gap-2 overflow-x-auto select-none">
      <div className="flex items-center gap-1">
        {order.map((type) => {
          const count = counts[type] || 0;
          if (count === 0) return null;

          return (
            <div key={type} className="flex items-center -mr-1">
              <div className="w-5 h-5 flex items-center justify-center">
                {renderPiece(type, capturedPieceColor)}
              </div>
              {count > 1 && (
                <span className="text-[10px] font-bold text-gray-400 -ml-1">
                  ×{count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {hasAdvantage && advantageDiff > 0 && (
        <span className="text-xs font-bold text-chess-accent bg-chess-accent/15 px-1.5 py-0.5 rounded border border-chess-accent/30">
          +{advantageDiff}
        </span>
      )}
    </div>
  );
};
