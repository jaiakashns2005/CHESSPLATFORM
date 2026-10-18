export type PositionalCategory =
  | 'King Safety'
  | 'Piece Activity'
  | 'Weak Squares'
  | 'Outposts'
  | 'Pawn Structure'
  | 'Open Files'
  | 'Open Diagonals'
  | 'Good vs Bad Pieces'
  | 'Space'
  | 'Improving the Worst-placed Piece';

export type PositionalDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type PositionalAttemptStatus = 'loading' | 'ready' | 'solved' | 'failed';

export interface PositionalChallenge {
  id: string;
  title: string;
  category: PositionalCategory;
  difficulty: PositionalDifficulty;
  contextMovesSan: string[];
  hint: string;
  deeperHint: string;
  explanation: string;
}

export interface PositionalProgress {
  attempted: number;
  solved: number;
  currentStreak: number;
  bestStreak: number;
  byCategory: Partial<Record<PositionalCategory, { attempted: number; solved: number }>>;
}

export interface PositionTrainingProgress {
  score: number;
  progress: PositionalProgress;
}