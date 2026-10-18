import React, { useState } from 'react';
import { useBoardEditor } from '../../hooks/useBoardEditor';
import { PiecePalette } from './PiecePalette';
import { PositionSettings } from './PositionSettings';
import { Square } from '../board/Square';
import { Piece } from '../board/Piece';
import { FENModal } from '../game/FENModal';
import { BoardTheme, ChessSquare } from '../../types/chess';
import { STARTING_FEN } from '../../utils/chessUtils';
import { FileCode } from 'lucide-react';

interface PositionEditorProps {
  currentTheme: BoardTheme;
  initialFen?: string;
  onLoadIntoAnalysis: (fen: string) => void;
  onPlayFromPosition: (fen: string) => void;
}

export const PositionEditor: React.FC<PositionEditorProps> = ({
  currentTheme,
  initialFen = STARTING_FEN,
  onLoadIntoAnalysis,
  onPlayFromPosition,
}) => {
  const {
    state,
    validation,
    currentFen,
    handleSquareClick,
    handleDropPiece,
    selectPalettePiece,
    clearBoard,
    resetToStartingPosition,
    setTurn,
    toggleCastling,
    setEnPassantSquare,
    loadFEN,
  } = useBoardEditor(initialFen);

  const [isFENModalOpen, setIsFENModalOpen] = useState(false);

  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start animate-fade-in">
      <header className="col-span-1 border-b border-chess-border pb-3 lg:col-span-2">
        <h2 className="text-xl font-extrabold text-white">Board Editor</h2>
      </header>
      {/* Left Column: Board Setup & Piece Palette */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Editor 8x8 Board */}
        <div className="relative w-full aspect-square max-w-[640px] max-h-[640px] rounded-lg overflow-hidden shadow-2xl border-4 border-[#2b2926] select-none bg-chess-card">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {ranks.map((rank) =>
              files.map((file) => {
                const square = `${file}${rank}` as ChessSquare;
                const piece = state.pieces[square];

                return (
                  <Square
                    key={square}
                    square={square}
                    orientation="white"
                    theme={currentTheme}
                    onClick={() => handleSquareClick(square)}
                    onDropMove={handleDropPiece}
                  >
                    {piece && (
                      <Piece
                        type={piece.type}
                        color={piece.color}
                        square={square}
                        isDraggable={true}
                      />
                    )}
                  </Square>
                );
              })
            )}
          </div>
        </div>

        {/* Piece Palette */}
        <div className="w-full max-w-[640px]">
          <PiecePalette
            selectedPiece={state.selectedPalettePiece}
            onSelectPiece={selectPalettePiece}
          />
        </div>
      </div>

      {/* Right Column: Settings, Validation & Actions */}
      <div className="flex flex-col gap-4 w-full">
        {/* FEN Bar */}
        <div className="bg-chess-card border border-chess-border rounded-lg p-3 shadow-lg flex items-center justify-between gap-2">
          <div className="text-[11px] font-mono text-gray-300 truncate select-all">
            {currentFen}
          </div>
          <button
            onClick={() => setIsFENModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-chess-surface hover:bg-chess-border text-chess-accent font-bold text-xs border border-chess-border shrink-0 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Import / Presets</span>
          </button>
        </div>

        {/* Position Settings Card */}
        <PositionSettings
          turn={state.turn}
          castling={state.castling}
          enPassantSquare={state.enPassantSquare}
          validation={validation}
          onSetTurn={setTurn}
          onToggleCastling={toggleCastling}
          onSetEnPassant={(sq) => setEnPassantSquare(sq as ChessSquare | '-')}
          onClearBoard={clearBoard}
          onResetBoard={resetToStartingPosition}
          onLoadIntoAnalysis={onLoadIntoAnalysis}
          onPlayFromPosition={onPlayFromPosition}
        />
      </div>

      {/* FEN Modal */}
      <FENModal
        currentFen={currentFen}
        pgn=""
        isOpen={isFENModalOpen}
        onClose={() => setIsFENModalOpen(false)}
        onLoadFen={(loadedFen) => loadFEN(loadedFen)}
        onLoadPGN={() => ({ success: false, error: 'Cannot load PGN into position editor.' })}
      />
    </div>
  );
};
