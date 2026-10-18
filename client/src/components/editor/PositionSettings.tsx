import React from 'react';
import { PieceColor } from '../../types/chess';
import { PositionValidationResult } from '../../core/positionValidator';
import { AlertCircle, AlertTriangle, Play, Sparkles, RotateCcw, Trash2 } from 'lucide-react';

interface PositionSettingsProps {
  turn: PieceColor;
  castling: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassantSquare: string;
  validation: PositionValidationResult;
  onSetTurn: (turn: PieceColor) => void;
  onToggleCastling: (right: 'whiteKingside' | 'whiteQueenside' | 'blackKingside' | 'blackQueenside') => void;
  onSetEnPassant: (square: string) => void;
  onClearBoard: () => void;
  onResetBoard: () => void;
  onLoadIntoAnalysis: (fen: string) => void;
  onPlayFromPosition: (fen: string) => void;
}

export const PositionSettings: React.FC<PositionSettingsProps> = ({
  turn,
  castling,
  enPassantSquare,
  validation,
  onSetTurn,
  onToggleCastling,
  onSetEnPassant,
  onClearBoard,
  onResetBoard,
  onLoadIntoAnalysis,
  onPlayFromPosition,
}) => {
  return (
    <div className="bg-chess-card border border-chess-border rounded-lg p-4 space-y-4 shadow-lg">
      {/* Side to Move */}
      <div>
        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
          Side to Move
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSetTurn('w')}
            className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              turn === 'w'
                ? 'bg-white text-gray-900 border-white shadow-md'
                : 'bg-chess-surface text-gray-300 border-chess-border hover:bg-chess-border'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-gray-400" />
            <span>White</span>
          </button>
          <button
            onClick={() => onSetTurn('b')}
            className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              turn === 'b'
                ? 'bg-gray-900 text-white border-gray-600 shadow-md ring-1 ring-gray-400'
                : 'bg-chess-surface text-gray-300 border-chess-border hover:bg-chess-border'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-gray-900 ring-1 ring-gray-400" />
            <span>Black</span>
          </button>
        </div>
      </div>

      {/* Castling Rights */}
      <div>
        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
          Castling Rights
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2 bg-chess-surface p-2 rounded border border-chess-border/80 cursor-pointer">
            <input
              type="checkbox"
              checked={castling.whiteKingside}
              onChange={() => onToggleCastling('whiteKingside')}
              className="rounded accent-chess-accent"
            />
            <span className="text-gray-200">White O-O</span>
          </label>
          <label className="flex items-center gap-2 bg-chess-surface p-2 rounded border border-chess-border/80 cursor-pointer">
            <input
              type="checkbox"
              checked={castling.whiteQueenside}
              onChange={() => onToggleCastling('whiteQueenside')}
              className="rounded accent-chess-accent"
            />
            <span className="text-gray-200">White O-O-O</span>
          </label>
          <label className="flex items-center gap-2 bg-chess-surface p-2 rounded border border-chess-border/80 cursor-pointer">
            <input
              type="checkbox"
              checked={castling.blackKingside}
              onChange={() => onToggleCastling('blackKingside')}
              className="rounded accent-chess-accent"
            />
            <span className="text-gray-200">Black O-O</span>
          </label>
          <label className="flex items-center gap-2 bg-chess-surface p-2 rounded border border-chess-border/80 cursor-pointer">
            <input
              type="checkbox"
              checked={castling.blackQueenside}
              onChange={() => onToggleCastling('blackQueenside')}
              className="rounded accent-chess-accent"
            />
            <span className="text-gray-200">Black O-O-O</span>
          </label>
        </div>
      </div>

      {/* En Passant Square */}
      <div>
        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
          En Passant Target Square
        </label>
        <input
          type="text"
          value={enPassantSquare === '-' ? '' : enPassantSquare}
          onChange={(e) => onSetEnPassant(e.target.value ? e.target.value.toLowerCase() : '-')}
          placeholder="e.g. e6, d3, or leave blank"
          maxLength={2}
          className="w-full bg-chess-bg border border-chess-border rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-chess-accent"
        />
      </div>

      {/* Validation Banner */}
      {!validation.isValid && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-700/60 text-xs text-rose-200 space-y-1 animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Position Errors (Illegal FIDE state):</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200/90 pl-1">
            {validation.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && validation.isValid && (
        <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-600/50 text-xs text-amber-200 space-y-1 animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Position Warnings:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
            {validation.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Board Utility Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-chess-border/60">
        <button
          onClick={onResetBoard}
          className="py-2 px-3 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-chess-border transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Board</span>
        </button>
        <button
          onClick={onClearBoard}
          className="py-2 px-3 rounded-lg bg-chess-surface hover:bg-rose-950/40 text-rose-300 border border-chess-border hover:border-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Board</span>
        </button>
      </div>

      {/* Load / Play Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-chess-border/60">
        <button
          onClick={() => onLoadIntoAnalysis(validation.fen)}
          disabled={!validation.isValid}
          className="w-full py-2.5 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Load into Analysis Workspace</span>
        </button>

        <button
          onClick={() => onPlayFromPosition(validation.fen)}
          disabled={!validation.isValid}
          className="w-full py-2.5 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-100 font-bold text-xs flex items-center justify-center gap-2 border border-chess-border transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          <Play className="w-4 h-4" />
          <span>Play Game from this Position</span>
        </button>
      </div>
    </div>
  );
};
