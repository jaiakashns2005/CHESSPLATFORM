import React, { useState } from 'react';
import {
  RotateCcw,
  ArrowUpDown,
  Undo2,
  FileCode,
  Flag,
  Handshake,
  Volume2,
  VolumeX,
  Timer,
  Play,
  Check,
  X,
} from 'lucide-react';
import { PieceColor, TimeControl } from '../../types/chess';
import { formatTimeControlLabel } from '../../utils/timeUtils';

interface GameControlsProps {
  turn: PieceColor;
  isGameOver: boolean;
  canUndo: boolean;
  soundEnabled: boolean;
  timeControl: TimeControl;
  onNewGame: () => void;
  onRematch: () => void;
  onFlipBoard: () => void;
  onUndoMove: () => void;
  onOpenFENModal: () => void;
  onOpenTimeControlModal: () => void;
  onResign: (color: PieceColor) => void;
  onOfferDraw: (byColor: PieceColor) => void;
  onToggleSound: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  turn,
  isGameOver,
  canUndo,
  soundEnabled,
  timeControl,
  onNewGame,
  onRematch,
  onFlipBoard,
  onUndoMove,
  onOpenFENModal,
  onOpenTimeControlModal,
  onResign,
  onOfferDraw,
  onToggleSound,
}) => {
  const [isConfirmingResign, setIsConfirmingResign] = useState(false);

  const handleConfirmResign = () => {
    onResign(turn);
    setIsConfirmingResign(false);
  };

  return (
    <div className="bg-chess-card border border-chess-border rounded-lg p-3 shadow-lg space-y-2.5">
      {/* Time Control Badge & Selector */}
      <div className="flex items-center justify-between bg-chess-surface px-3 py-2 rounded-lg border border-chess-border/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
          <Timer className="w-4 h-4 text-chess-accent" />
          <span>Time Control:</span>
          <span className="font-mono text-chess-accent font-bold">
            {formatTimeControlLabel(timeControl)}
          </span>
        </div>
        <button
          onClick={onOpenTimeControlModal}
          className="text-[11px] font-bold text-chess-accent hover:text-chess-accentHover bg-chess-accent/15 hover:bg-chess-accent/25 px-2.5 py-1 rounded border border-chess-accent/30 transition-colors"
        >
          Change
        </button>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {isGameOver ? (
          <button
            onClick={onRematch}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs transition-all shadow active:scale-95 group col-span-1"
          >
            <Play className="w-4 h-4 mb-1 fill-white" />
            <span>Rematch</span>
          </button>
        ) : (
          <button
            onClick={onNewGame}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs transition-all shadow active:scale-95 group col-span-1"
          >
            <RotateCcw className="w-4 h-4 mb-1 group-hover:-rotate-90 transition-transform" />
            <span>New Game</span>
          </button>
        )}

        <button
          onClick={onFlipBoard}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-200 font-semibold text-xs border border-chess-border transition-all active:scale-95"
        >
          <ArrowUpDown className="w-4 h-4 mb-1 text-gray-400" />
          <span>Flip Board</span>
        </button>

        <button
          onClick={onUndoMove}
          disabled={!canUndo || isGameOver}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-200 font-semibold text-xs border border-chess-border transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Undo2 className="w-4 h-4 mb-1 text-gray-400" />
          <span>Undo</span>
        </button>
      </div>

      {/* Secondary Controls: Draw, Resign, FEN/PGN, Sound */}
      <div className="pt-1 border-t border-chess-border/60">
        {isConfirmingResign ? (
          <div className="p-2 bg-rose-950/60 border border-rose-700/60 rounded-lg flex items-center justify-between gap-2 animate-fade-in">
            <span className="text-xs font-bold text-rose-200">
              Resign as {turn === 'w' ? 'White' : 'Black'}?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleConfirmResign}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                Yes
              </button>
              <button
                onClick={() => setIsConfirmingResign(false)}
                className="px-2.5 py-1 rounded bg-chess-surface hover:bg-chess-border text-gray-200 text-xs font-semibold"
              >
                <X className="w-3.5 h-3.5" />
                No
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={onOpenFENModal}
              title="Position Setup & PGN Data"
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-md bg-chess-surface/70 hover:bg-chess-surface text-gray-300 text-xs font-medium border border-chess-border/80 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-chess-accent" />
              <span className="truncate">PGN / FEN</span>
            </button>

            <button
              onClick={() => onOfferDraw(turn)}
              disabled={isGameOver}
              title="Offer Draw to Opponent"
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-md bg-chess-surface/70 hover:bg-chess-surface text-gray-300 text-xs font-medium border border-chess-border/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Handshake className="w-3.5 h-3.5 text-amber-400" />
              <span>Draw</span>
            </button>

            <button
              onClick={() => setIsConfirmingResign(true)}
              disabled={isGameOver}
              title={`Resign as ${turn === 'w' ? 'White' : 'Black'}`}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-md bg-chess-surface/70 hover:bg-rose-950/40 text-gray-300 hover:text-rose-200 text-xs font-medium border border-chess-border/80 hover:border-rose-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>Resign</span>
            </button>

            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium border transition-colors ${
                soundEnabled
                  ? 'bg-chess-surface/70 text-gray-300 border-chess-border/80 hover:bg-chess-surface'
                  : 'bg-rose-950/30 text-rose-300 border-rose-800/40'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sound</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
