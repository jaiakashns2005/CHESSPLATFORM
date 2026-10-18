import React from 'react';
import { ChessSquare, BoardOrientation } from '../../types/chess';
import { isSquareLight } from '../../utils/chessUtils';

interface CoordinatesProps {
  square: ChessSquare;
  orientation: BoardOrientation;
}

export const Coordinates: React.FC<CoordinatesProps> = ({ square, orientation }) => {
  const file = square[0];
  const rank = square[1];
  const isLight = isSquareLight(square);

  const showFile = orientation === 'white' ? rank === '1' : rank === '8';
  const showRank = orientation === 'white' ? file === 'a' : file === 'h';

  if (!showFile && !showRank) return null;

  const textColorClass = isLight ? 'text-chess-darkSquare' : 'text-chess-lightSquare';

  return (
    <div className={`absolute inset-0 pointer-events-none text-[11px] font-bold ${textColorClass} select-none`}>
      {showRank && (
        <span className="absolute top-0.5 left-1 leading-none opacity-85">
          {rank}
        </span>
      )}
      {showFile && (
        <span className="absolute bottom-0.5 right-1 leading-none opacity-85">
          {file}
        </span>
      )}
    </div>
  );
};
