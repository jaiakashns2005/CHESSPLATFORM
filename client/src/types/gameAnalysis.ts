import { MoveClassification } from './engine';
import { PieceColor } from './chess';

export type GameAnalysisStatus = 'idle' | 'loading' | 'completed' | 'error' | 'cancelled';

export interface GameAnalysisMove {
  nodeId: string;
  moveNumber: number;
  color: PieceColor;
  playedMoveSan: string;
  playedMoveUci: string;
  bestMoveSan: string;
  bestMoveUci: string;
  scoreBeforeCp: number;
  scoreAfterCp: number;
  evaluationBefore: string;
  evaluationAfter: string;
  centipawnLoss: number;
  classification: MoveClassification;
  fenBefore: string;
  fenAfter: string;
}

export interface GameEvaluationPoint {
  position: number;
  moveLabel: string;
  scoreCp: number;
  evaluation: string;
  nodeId: string | null;
}

export interface GameAnalysisSummary {
  whiteAccuracy: number;
  blackAccuracy: number;
  bestMoves: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
}