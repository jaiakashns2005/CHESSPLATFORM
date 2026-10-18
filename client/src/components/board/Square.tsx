import React from 'react';
import { ChessSquare, BoardOrientation, BoardTheme } from '../../types/chess';
import { isSquareLight } from '../../utils/chessUtils';
import { Coordinates } from './Coordinates';

interface SquareProps {
  square: ChessSquare;
  orientation: BoardOrientation;
  theme: BoardTheme;
  isSelected?: boolean;
  isLastMove?: boolean;
  isCheck?: boolean;
  isLegalMove?: boolean;
  hasPiece?: boolean;
  onClick: (square: ChessSquare) => void;
  onDropMove: (from: ChessSquare, to: ChessSquare) => void;
  onRightMouseDown?: (square: ChessSquare) => void;
  onRightMouseUp?: (square: ChessSquare) => void;
  children?: React.ReactNode;
}

export const Square: React.FC<SquareProps> = ({
  square,
  orientation,
  theme,
  isSelected = false,
  isLastMove = false,
  isCheck = false,
  isLegalMove = false,
  hasPiece = false,
  onClick,
  onDropMove,
  onRightMouseDown,
  onRightMouseUp,
  children,
}) => {
  const isLight = isSquareLight(square);

  // Background color resolution
  let bgColor = isLight ? theme.light : theme.dark;

  if (isLastMove) {
    bgColor = isLight ? theme.highlightLight : theme.highlightDark;
  }
  if (isSelected) {
    bgColor = '#f7f769';
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData('text/plain') as ChessSquare;
    if (fromSquare && fromSquare !== square) {
      onDropMove(fromSquare, square);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      if (onRightMouseDown) onRightMouseDown(square);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      if (onRightMouseUp) onRightMouseUp(square);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onClick={() => onClick(square)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ backgroundColor: bgColor }}
      className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none transition-colors duration-100 ${
        isCheck ? 'ring-inset ring-4 ring-chess-danger bg-red-600/40 animate-pulse-subtle' : ''
      }`}
      data-square={square}
    >
      <Coordinates square={square} orientation={orientation} />

      {/* Piece */}
      {children}

      {/* Legal Move Indicators */}
      {isLegalMove && !hasPiece && (
        <div className="absolute w-[30%] h-[30%] rounded-full bg-black/25 pointer-events-none z-10 animate-scale-in" />
      )}

      {isLegalMove && hasPiece && (
        <div className="absolute w-[86%] h-[86%] rounded-full border-[5px] border-black/25 pointer-events-none z-10 animate-scale-in" />
      )}
    </div>
  );
};
