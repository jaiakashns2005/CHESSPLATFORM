import { MoveClassification, MoveQualityData } from '../../types/engine';
import { PieceColor } from '../../types/chess';

/**
 * Calculates win percentage from centipawn evaluation using standard logistic model.
 * @param cp Centipawns from White's perspective (+ White advantage, - Black advantage)
 * @returns Win chance percentage for White (0 to 100)
 */
export const calculateWinPercentage = (cp: number): number => {
  // Clamped between -4000 and +4000
  const clampedCp = Math.max(-4000, Math.min(4000, cp));
  // Standard Lichess / modern chess model formula
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clampedCp)) - 1);
};

/**
 * Normalizes centipawn score from the perspective of the player to move.
 * @param cp Centipawns from White's perspective
 * @param turn Side to move ('w' or 'b')
 */
export const getPlayerPerspectiveScore = (cp: number, turn: PieceColor): number => {
  return turn === 'w' ? cp : -cp;
};

/**
 * Classifies a move based on centipawn loss between the best engine move
 * and the actual played move.
 *
 * Thresholds:
 * - Best Move: cp loss <= 5 cp or exact match
 * - Excellent: cp loss <= 20 cp
 * - Good: cp loss <= 50 cp
 * - Inaccuracy: cp loss <= 100 cp
 * - Mistake: cp loss <= 200 cp
 * - Blunder: cp loss > 200 cp
 */
export const classifyMoveEvaluation = (
  playedMoveUci: string,
  playedMoveSan: string,
  bestMoveUci: string,
  bestMoveSan: string,
  scoreBeforeCp: number, // from perspective of player making the move
  scoreAfterCp: number,  // from perspective of same player after move
  isOnlyLegalMove: boolean = false
): MoveQualityData => {
  if (isOnlyLegalMove) {
    return {
      classification: 'forced',
      playedMoveSan,
      playedMoveUci,
      bestMoveSan,
      bestMoveUci,
      centipawnLoss: 0,
      scoreBeforeCp,
      scoreAfterCp,
    };
  }

  // Exact move match
  if (playedMoveUci === bestMoveUci) {
    return {
      classification: 'best',
      playedMoveSan,
      playedMoveUci,
      bestMoveSan,
      bestMoveUci,
      centipawnLoss: 0,
      scoreBeforeCp,
      scoreAfterCp,
    };
  }

  // Centipawn loss is how much worse the position got for the moving player
  const centipawnLoss = Math.max(0, scoreBeforeCp - scoreAfterCp);

  let classification: MoveClassification = 'good';
  if (centipawnLoss <= 5) {
    classification = 'best';
  } else if (centipawnLoss <= 20) {
    classification = 'excellent';
  } else if (centipawnLoss <= 50) {
    classification = 'good';
  } else if (centipawnLoss <= 100) {
    classification = 'inaccuracy';
  } else if (centipawnLoss <= 200) {
    classification = 'mistake';
  } else {
    classification = 'blunder';
  }

  return {
    classification,
    playedMoveSan,
    playedMoveUci,
    bestMoveSan,
    bestMoveUci,
    centipawnLoss,
    scoreBeforeCp,
    scoreAfterCp,
  };
};
