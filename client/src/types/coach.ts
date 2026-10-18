import { PuzzleDifficulty } from './puzzle';

export type CoachArea = 'puzzles' | 'openings' | 'positional' | 'endgame' | 'game-review';
export type CoachMovePhase = 'opening' | 'middlegame' | 'endgame';

export interface CoachAreaMetric {
  area: Exclude<CoachArea, 'game-review'>;
  label: string;
  attempted: number;
  solved: number;
  accuracy: number;
}

export interface CoachRecommendation {
  area: CoachArea;
  label: string;
  reason: string;
  puzzleDifficulty: PuzzleDifficulty;
}

export interface CoachActivity {
  id: string;
  label: string;
  detail: string;
  at: number;
}

export interface CoachAccuracySnapshot {
  date: string;
  accuracy: number;
  positionsAttempted: number;
}

export interface CoachProgress {
  dailySessions: number;
  totalTrainingSeconds: number;
  lastSessionDate: string | null;
  currentDailyStreak: number;
  bestDailyStreak: number;
  weakAreas: string[];
  activities: CoachActivity[];
  accuracyHistory: CoachAccuracySnapshot[];
  activeSessionDate: string | null;
  activeSessionStartedAt: number | null;
  activeSessionCompleted: CoachArea[];
  pendingActivity: CoachArea | null;
  pendingActivityBaseline: number | null;
}

export interface CoachReviewSummary {
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  bestMoves: number;
  missedOpportunities: number;
  phaseAccuracy: Record<CoachMovePhase, number | null>;
  overallAccuracy: number;
  recommendations: CoachRecommendation[];
}
