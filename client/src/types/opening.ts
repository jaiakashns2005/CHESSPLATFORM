import { ChessSquare, PieceColor } from './chess';

export interface OpeningLine {
  id: string;
  name: string;
  family: string;
  variation: string;
  movesSan: string[];
  description: string;
  practiceColor: PieceColor;
}

export interface OpeningPly {
  san: string;
  uci: string;
  from: ChessSquare;
  to: ChessSquare;
  color: PieceColor;
  moveNumber: number;
  fenAfter: string;
}

export interface OpeningProgress {
  linesPracticed: number;
  movesCorrect: number;
  movesAttempted: number;
  lastPracticedAt: number | null;
}

export interface OpeningTrainingProgress {
  favorites: string[];
  byOpening: Record<string, OpeningProgress>;
}