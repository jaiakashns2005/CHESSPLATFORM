import React, { useEffect } from 'react';
import { PieceType, PieceColor } from '../../types/chess';
import { renderPiece } from '../../assets/pieces';

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  color,
  onSelect,
  onCancel,
}) => {
  const pieces: { type: PieceType; name: string; key: string }[] = [
    { type: 'q', name: 'Queen', key: 'Q' },
    { type: 'n', name: 'Knight', key: 'N' },
    { type: 'r', name: 'Rook', key: 'R' },
    { type: 'b', name: 'Bishop', key: 'B' },
  ];

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'q') onSelect('q');
      else if (key === 'n') onSelect('n');
      else if (key === 'r') onSelect('r');
      else if (key === 'b') onSelect('b');
      else if (key === 'escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelect, onCancel]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-chess-card border border-chess-border rounded-xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white tracking-wide">Promote Pawn</h3>
          <p className="text-xs text-gray-400 mt-1">Select a piece to promote your pawn to</p>
        </div>

        <div className="grid grid-cols-4 gap-3 w-full my-2">
          {pieces.map(({ type, name, key }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-chess-surface hover:bg-chess-accent/20 border border-chess-border hover:border-chess-accent transition-all duration-150 group active:scale-95"
            >
              <div className="w-14 h-14 group-hover:scale-110 transition-transform">
                {renderPiece(type, color)}
              </div>
              <span className="text-xs font-semibold text-gray-200 mt-2">{name}</span>
              <span className="text-[10px] text-gray-400 bg-chess-bg px-1.5 py-0.5 rounded mt-1 border border-chess-border">
                {key}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors py-1 px-4 rounded hover:bg-chess-surface"
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
};
