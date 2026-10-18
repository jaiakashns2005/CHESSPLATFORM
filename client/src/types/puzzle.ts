import { PieceColor } from './chess';

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';
export type PuzzleStatus = 'playing' | 'correct' | 'failed' | 'completed';

export interface ChessPuzzle {
  id: string;
  title: string;
  theme: string;
  difficulty: PuzzleDifficulty;
  fen: string;
  playerColor: PieceColor;
  solutionUci: string[];
  hint: string;
  explanation: string;
  timeLimitSeconds: number;
}

export interface PuzzleStats {
  attempted: number;
  solved: number;
  currentStreak: number;
  bestStreak: number;
  score: number;
}