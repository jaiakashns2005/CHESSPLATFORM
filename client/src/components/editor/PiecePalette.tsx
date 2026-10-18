import React from 'react';
import { PieceColor, PieceType } from '../../types/chess';
import { renderPiece } from '../../assets/pieces';
import { Trash2, MousePointer } from 'lucide-react';

interface PiecePaletteProps {
  selectedPiece: { type: PieceType; color: PieceColor } | 'trash' | null;
  onSelectPiece: (piece: { type: PieceType; color: PieceColor } | 'trash' | null) => void;
}

export const PiecePalette: React.FC<PiecePaletteProps> = ({
  selectedPiece,
  onSelectPiece,
}) => {
  const whitePieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
  const blackPieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

  return (
    <div className="bg-chess-card border border-chess-border rounded-lg p-3 space-y-2.5 shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs text-gray-200 uppercase tracking-wider">Piece Palette</h4>
        <button
          onClick={() => onSelectPiece(null)}
          title="Pointer tool"
          className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
            selectedPiece === null
              ? 'bg-chess-accent text-white border-chess-accent'
              : 'bg-chess-surface text-gray-400 border-chess-border hover:text-gray-200'
          }`}
        >
          <MousePointer className="w-3 h-3" />
          <span>Select</span>
        </button>
      </div>

      {/* White Pieces */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase">White Pieces</span>
        <div className="grid grid-cols-6 gap-1.5 bg-chess-surface p-1.5 rounded-lg border border-chess-border/80">
          {whitePieces.map((type) => {
            const isSelected =
              selectedPiece !== null &&
              selectedPiece !== 'trash' &&
              selectedPiece.type === type &&
              selectedPiece.color === 'w';

            return (
              <button
                key={`w-${type}`}
                onClick={() => onSelectPiece({ type, color: 'w' })}
                className={`p-1.5 rounded flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-chess-accent/30 border-2 border-chess-accent scale-105 shadow'
                    : 'hover:bg-chess-card border border-transparent hover:border-chess-border'
                }`}
              >
                <div className="w-7 h-7">{renderPiece(type, 'w')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Black Pieces */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Black Pieces</span>
        <div className="grid grid-cols-6 gap-1.5 bg-chess-surface p-1.5 rounded-lg border border-chess-border/80">
          {blackPieces.map((type) => {
            const isSelected =
              selectedPiece !== null &&
              selectedPiece !== 'trash' &&
              selectedPiece.type === type &&
              selectedPiece.color === 'b';

            return (
              <button
                key={`b-${type}`}
                onClick={() => onSelectPiece({ type, color: 'b' })}
                className={`p-1.5 rounded flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-chess-accent/30 border-2 border-chess-accent scale-105 shadow'
                    : 'hover:bg-chess-card border border-transparent hover:border-chess-border'
                }`}
              >
                <div className="w-7 h-7">{renderPiece(type, 'b')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trash / Eraser Tool */}
      <button
        onClick={() => onSelectPiece(selectedPiece === 'trash' ? null : 'trash')}
        className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          selectedPiece === 'trash'
            ? 'bg-rose-950 border-rose-600 text-rose-200 ring-2 ring-rose-500/40'
            : 'bg-chess-surface hover:bg-rose-950/30 text-gray-300 hover:text-rose-300 border-chess-border'
        }`}
      >
        <Trash2 className="w-4 h-4 text-rose-400" />
        <span>Trash Tool (Click squares to delete)</span>
      </button>
    </div>
  );
};
