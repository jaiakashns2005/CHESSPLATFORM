import React from 'react';
import { PieceType, PieceColor, ChessSquare } from '../../types/chess';
import { renderPiece } from '../../assets/pieces';

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  square: ChessSquare;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, square: ChessSquare) => void;
}

export const Piece: React.FC<PieceProps> = ({
  type,
  color,
  square,
  isDraggable = true,
  onDragStart,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, square);
    }
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={`w-full h-full flex items-center justify-center select-none transition-transform duration-100 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105' : ''
      }`}
      data-square={square}
      data-piece={`${color}${type}`}
    >
      <div className="w-[88%] h-[88%] drop-shadow-md pointer-events-none">
        {renderPiece(type, color)}
      </div>
    </div>
  );
};
