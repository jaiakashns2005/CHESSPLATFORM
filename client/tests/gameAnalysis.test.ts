import { describe, expect, it } from 'vitest';
import {
  calculateGameAccuracy,
  classifyCentipawnLoss,
  evaluationLoss,
  evaluationToCentipawns,
  summarizeGameAnalysis,
} from '../src/core/engine/gameAnalysis';
import { GameAnalysisMove } from '../src/types/gameAnalysis';

const makeMove = (overrides: Partial<GameAnalysisMove> = {}): GameAnalysisMove => ({
  nodeId: 'move-1',
  moveNumber: 1,
  color: 'w',
  playedMoveSan: 'e4',
  playedMoveUci: 'e2e4',
  bestMoveSan: 'e4',
  bestMoveUci: 'e2e4',
  scoreBeforeCp: 20,
  scoreAfterCp: 20,
  evaluationBefore: '+0.2',
  evaluationAfter: '+0.2',
  centipawnLoss: 0,
  classification: 'best',
  fenBefore: 'start',
  fenAfter: 'after-e4',
  ...overrides,
});

describe('Game analysis calculations', () => {
  it('classifies centipawn loss at each requested threshold', () => {
    expect([0, 6, 21, 51, 101, 201].map(classifyCentipawnLoss)).toEqual([
      'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder',
    ]);
  });

  it('calculates evaluation loss from the mover perspective for both colors', () => {
    expect(evaluationLoss(80, 20, 'w')).toBe(60);
    expect(evaluationLoss(-80, -20, 'b')).toBe(60);
    expect(evaluationLoss(20, 80, 'w')).toBe(0);
  });

  it('converts mate evaluations to signed sortable scores', () => {
    expect(evaluationToCentipawns({ multipv: 1, depth: 12, scoreMate: 3, scoreDisplay: '+M3', pvUci: [], pvSan: [] })).toBe(9970);
    expect(evaluationToCentipawns({ multipv: 1, depth: 12, scoreCp: -45, scoreDisplay: '-0.5', pvUci: [], pvSan: [] })).toBe(-45);
  });

  it('summarizes both players and returns lower accuracy for larger losses', () => {
    const moves = [
      makeMove(),
      makeMove({ nodeId: 'move-2', color: 'b', moveNumber: 1, centipawnLoss: 100, classification: 'mistake' }),
      makeMove({ nodeId: 'move-3', color: 'w', moveNumber: 2, centipawnLoss: 250, classification: 'blunder' }),
    ];
    const summary = summarizeGameAnalysis(moves);

    expect(summary.whiteAccuracy).toBeLessThan(100);
    expect(summary.blackAccuracy).toBeLessThan(100);
    expect(summary.bestMoves).toBe(1);
    expect(summary.mistakes).toBe(1);
    expect(summary.blunders).toBe(1);
    expect(summary.inaccuracies).toBe(0);
    expect(calculateGameAccuracy(moves, 'w')).toBeLessThan(calculateGameAccuracy([moves[0]], 'w'));
  });
});