import { ChessSquare, PieceColor, PieceType } from './chess';

export type AnnotationColor = 'green' | 'red' | 'blue' | 'yellow' | 'cyan';

export interface BoardArrow {
  id: string;
  from: ChessSquare;
  to: ChessSquare;
  color: AnnotationColor;
}

export interface SquareHighlight {
  square: ChessSquare;
  color: AnnotationColor;
}

export interface MoveTreeNode {
  id: string;
  san: string;
  from: ChessSquare;
  to: ChessSquare;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  fen: string;
  moveNumber: number;
  isCheck: boolean;
  isCheckmate: boolean;
  comment?: string;
  parentId: string | null;
  childrenIds: string[];
  isMainline: boolean;
}

export interface PositionEditorState {
  pieces: Partial<Record<ChessSquare, { type: PieceType; color: PieceColor }>>;
  turn: PieceColor;
  castling: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassantSquare: ChessSquare | '-';
  halfmoveClock: number;
  fullmoveNumber: number;
  selectedPalettePiece: { type: PieceType; color: PieceColor } | 'trash' | null;
}

export type ActiveAppView = 'play' | 'analysis' | 'editor' | 'puzzles' | 'openings' | 'positional' | 'endgame' | 'coach';
