import { PieceColor } from '../../types/chess';
import { EngineEvaluation, MoveClassification } from '../../types/engine';
import { GameAnalysisMove, GameAnalysisSummary } from '../../types/gameAnalysis';

export const evaluationToCentipawns = (evaluation: EngineEvaluation): number | null => {
  if (evaluation.scoreCp !== undefined) return evaluation.scoreCp;
  if (evaluation.scoreMate !== undefined) {
    const distance = Math.min(Math.abs(evaluation.scoreMate), 100);
    return Math.sign(evaluation.scoreMate) * (10000 - distance * 10);
  }
  return null;
};

export const classifyCentipawnLoss = (loss: number): MoveClassification => {
  if (loss <= 5) return 'best';
  if (loss <= 20) return 'excellent';
  if (loss <= 50) return 'good';
  if (loss <= 100) return 'inaccuracy';
  if (loss <= 200) return 'mistake';
  return 'blunder';
};

export const getEvaluationDisplay = (evaluation: EngineEvaluation): string => {
  if (evaluation.scoreMate !== undefined) return evaluation.scoreDisplay;
  if (evaluation.scoreCp !== undefined) return evaluation.scoreDisplay;
  return '—';
};

export const calculateGameAccuracy = (moves: GameAnalysisMove[], color: PieceColor): number => {
  const playerMoves = moves.filter((move) => move.color === color);
  if (playerMoves.length === 0) return 100;
  const averageLoss = playerMoves.reduce((sum, move) => sum + move.centipawnLoss, 0) / playerMoves.length;
  return Math.round(100 * Math.exp(-0.01 * averageLoss));
};

export const summarizeGameAnalysis = (moves: GameAnalysisMove[]): GameAnalysisSummary => ({
  whiteAccuracy: calculateGameAccuracy(moves, 'w'),
  blackAccuracy: calculateGameAccuracy(moves, 'b'),
  bestMoves: moves.filter((move) => move.classification === 'best').length,
  inaccuracies: moves.filter((move) => move.classification === 'inaccuracy').length,
  mistakes: moves.filter((move) => move.classification === 'mistake').length,
  blunders: moves.filter((move) => move.classification === 'blunder').length,
});

export const scoreFromMoverPerspective = (scoreCp: number, color: PieceColor): number => color === 'w' ? scoreCp : -scoreCp;

export const evaluationLoss = (beforeCp: number, afterCp: number, mover: PieceColor): number =>
  Math.max(0, scoreFromMoverPerspective(beforeCp, mover) - scoreFromMoverPerspective(afterCp, mover));