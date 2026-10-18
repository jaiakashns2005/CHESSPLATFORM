import React, { useMemo } from 'react';
import { Chess, Square as ChessJSSquare } from 'chess.js';
import {
  ChessSquare,
  BoardOrientation,
  BoardTheme,
  PendingPromotion,
  PieceType,
  PieceColor,
} from '../../types/chess';
import { BoardArrow, SquareHighlight } from '../../types/analysis';
import { Square } from './Square';
import { Piece } from './Piece';
import { PromotionModal } from './PromotionModal';
import { AnnotationOverlay } from './AnnotationOverlay';

interface ChessBoardProps {
  fen: string;
  turn: PieceColor;
  orientation: BoardOrientation;
  theme: BoardTheme;
  selectedSquare: ChessSquare | null;
  legalMoves: ChessSquare[];
  lastMove: { from: ChessSquare; to: ChessSquare } | null;
  pendingPromotion: PendingPromotion | null;
  isCheck: boolean;
  isGameOver: boolean;
  arrows?: BoardArrow[];
  squareHighlights?: SquareHighlight[];
  onSquareClick: (square: ChessSquare) => void;
  onDropMove: (from: ChessSquare, to: ChessSquare) => void;
  onConfirmPromotion: (piece: PieceType) => void;
  onCancelPromotion: () => void;
  onRightMouseDown?: (square: ChessSquare) => void;
  onRightMouseUp?: (square: ChessSquare) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  turn,
  orientation,
  theme,
  selectedSquare,
  legalMoves,
  lastMove,
  pendingPromotion,
  isCheck,
  isGameOver,
  arrows = [],
  squareHighlights = [],
  onSquareClick,
  onDropMove,
  onConfirmPromotion,
  onCancelPromotion,
  onRightMouseDown,
  onRightMouseUp,
}) => {
  // Parse piece placement from current FEN
  const boardPieces = useMemo(() => {
    try {
      const chess = new Chess(fen);
      const pieceMap: Partial<Record<ChessSquare, { type: PieceType; color: PieceColor }>> = {};

      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

      ranks.forEach((r) => {
        files.forEach((f) => {
          const sq = `${f}${r}` as ChessSquare;
          const piece = chess.get(sq as ChessJSSquare);
          if (piece) {
            pieceMap[sq] = { type: piece.type, color: piece.color };
          }
        });
      });
      return pieceMap;
    } catch {
      return {};
    }
  }, [fen]);

  // Find king square if currently in check
  const checkedKingSquare = useMemo(() => {
    if (!isCheck) return null;
    for (const [sq, piece] of Object.entries(boardPieces)) {
      if (piece && piece.type === 'k' && piece.color === turn) {
        return sq as ChessSquare;
      }
    }
    return null;
  }, [isCheck, boardPieces, turn]);

  // Build 8x8 grid based on orientation
  const ranks = orientation === 'white' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
  const files = orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  return (
    <div className="relative w-full aspect-square max-w-[640px] max-h-[640px] rounded-lg overflow-hidden shadow-2xl border-4 border-[#2b2926] select-none bg-chess-card">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank) =>
          files.map((file) => {
            const square = `${file}${rank}` as ChessSquare;
            const piece = boardPieces[square];
            const isSelected = selectedSquare === square;
            const isLast = lastMove ? lastMove.from === square || lastMove.to === square : false;
            const isKingInCheck = checkedKingSquare === square;
            const isLegal = legalMoves.includes(square);

            return (
              <Square
                key={square}
                square={square}
                orientation={orientation}
                theme={theme}
                isSelected={isSelected}
                isLastMove={isLast}
                isCheck={isKingInCheck}
                isLegalMove={isLegal}
                hasPiece={Boolean(piece)}
                onClick={onSquareClick}
                onDropMove={onDropMove}
                onRightMouseDown={onRightMouseDown}
                onRightMouseUp={onRightMouseUp}
              >
                {piece && (
                  <Piece
                    type={piece.type}
                    color={piece.color}
                    square={square}
                    isDraggable={!isGameOver && piece.color === turn}
                  />
                )}
              </Square>
            );
          })
        )}
      </div>

      {/* SVG Arrows & Square Highlights Layer */}
      <AnnotationOverlay
        arrows={arrows}
        squareHighlights={squareHighlights}
        orientation={orientation}
      />

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          onSelect={onConfirmPromotion}
          onCancel={onCancelPromotion}
        />
      )}
    </div>
  );
};
