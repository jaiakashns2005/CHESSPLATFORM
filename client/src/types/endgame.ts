import { PieceColor } from './chess';
import { PuzzleDifficulty } from './puzzle';

export const ENDGAME_CATEGORIES = [
  'King + Pawn vs King',
  'Queen vs Pawn',
  'Rook + King vs King',
  'Rook Endgames',
  'Bishop Endgames',
  'Knight Endgames',
  'Queen Endgames',
  'Basic Checkmate',
  'Pawn Promotion',
  'Opposition',
  'Zugzwang',
  'King and Pawn technique',
] as const;

export type EndgameCategory = typeof ENDGAME_CATEGORIES[number];

export interface EndgameSeed {
  id: string;
  category: EndgameCategory;
  title: string;
  fen: string;
  hint: string;
  explanation: string;
}

export interface EndgameCandidate extends EndgameSeed {
  fen: string;
}

export interface EndgameChallenge extends EndgameCandidate {
  difficulty: PuzzleDifficulty;
  playerColor: PieceColor;
  solutionUci: string;
  solutionSan: string;
  timeLimitSeconds: number;
}

export interface EndgameCategoryProgress {
  attempted: number;
  solved: number;
}

export interface EndgameProgress {
  attempted: number;
  solved: number;
  currentStreak: number;
  bestStreak: number;
  score: number;
  adaptiveRating: number;
  byCategory: Partial<Record<EndgameCategory, EndgameCategoryProgress>>;
}

export type EndgameStatus = 'playing' | 'solved' | 'failed';
