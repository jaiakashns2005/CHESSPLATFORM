import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { StockfishService } from '../core/engine/stockfishService';
import {
  classifyCentipawnLoss,
  evaluationLoss,
  evaluationToCentipawns,
  getEvaluationDisplay,
} from '../core/engine/gameAnalysis';
import { MoveTreeNode } from '../types/analysis';
import { EngineEvaluation } from '../types/engine';
import { GameAnalysisMove, GameAnalysisStatus, GameEvaluationPoint } from '../types/gameAnalysis';

interface PositionResult {
  evaluation: EngineEvaluation | null;
  bestMoveUci: string | null;
}

export const useGameAnalysis = () => {
  const [status, setStatus] = useState<GameAnalysisStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [moves, setMoves] = useState<GameAnalysisMove[]>([]);
  const [points, setPoints] = useState<GameEvaluationPoint[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const serviceRef = useRef<StockfishService | null>(null);
  const activeFenRef = useRef<string | null>(null);
  const latestEvaluationRef = useRef<EngineEvaluation | null>(null);
  const resolveSearchRef = useRef<((result: PositionResult) => void) | null>(null);
  const rejectSearchRef = useRef<((error: Error) => void) | null>(null);
  const runIdRef = useRef(0);

  const cancelAnalysis = useCallback(() => {
    runIdRef.current += 1;
    rejectSearchRef.current?.(new Error('Analysis cancelled.'));
    resolveSearchRef.current = null;
    rejectSearchRef.current = null;
    activeFenRef.current = null;
    serviceRef.current?.terminate();
    serviceRef.current = null;
    setStatus((current) => current === 'loading' ? 'cancelled' : current);
  }, []);

  useEffect(() => () => {
    runIdRef.current += 1;
    serviceRef.current?.terminate();
    serviceRef.current = null;
  }, []);

  const analyzeGame = useCallback(async (initialFen: string, mainline: MoveTreeNode[], depth: number = 12) => {
    cancelAnalysis();
    const runId = runIdRef.current;
    setError(null);
    setMoves([]);
    setPoints([]);
    setProgress({ completed: 0, total: mainline.length });

    if (mainline.length === 0) {
      setStatus('error');
      setError('Load a played game or PGN with at least one move to analyze.');
      return;
    }

    const service = new StockfishService({
      onEvaluationUpdate: (lines, _depth, fen) => {
        if (fen !== activeFenRef.current || runId !== runIdRef.current) return;
        latestEvaluationRef.current = lines.find((line) => line.multipv === 1) || null;
      },
      onSearchComplete: (fen, bestMoveUci) => {
        if (fen !== activeFenRef.current || runId !== runIdRef.current) return;
        resolveSearchRef.current?.({ evaluation: latestEvaluationRef.current, bestMoveUci });
        resolveSearchRef.current = null;
        rejectSearchRef.current = null;
      },
      onError: (message) => {
        if (runId !== runIdRef.current) return;
        rejectSearchRef.current?.(new Error(message));
        resolveSearchRef.current = null;
        rejectSearchRef.current = null;
      },
    });
    serviceRef.current = service;
    setStatus('loading');

    const searchPosition = (fen: string): Promise<PositionResult> => new Promise((resolve, reject) => {
      activeFenRef.current = fen;
      latestEvaluationRef.current = null;
      resolveSearchRef.current = resolve;
      rejectSearchRef.current = reject;
      service.startAnalysis(fen, depth, 1);
    });

    try {
      let chess = new Chess(initialFen);
      let before = await searchPosition(chess.fen());
      const initialCp = before.evaluation ? evaluationToCentipawns(before.evaluation) : null;
      if (initialCp === null) throw new Error('Stockfish did not return an evaluation for the initial position.');
      setPoints([{
        position: 0,
        moveLabel: 'Start',
        scoreCp: initialCp,
        evaluation: getEvaluationDisplay(before.evaluation!),
        nodeId: null,
      }]);

      const analyzed: GameAnalysisMove[] = [];
      for (let index = 0; index < mainline.length; index += 1) {
        if (runId !== runIdRef.current) return;
        const node = mainline[index];
        const fenBefore = chess.fen();
        const mover = chess.turn();
        const moveResult = chess.move({
          from: node.from as Square,
          to: node.to as Square,
          promotion: node.promotion,
        });
        if (!moveResult) throw new Error(`The recorded move ${node.san} is illegal in its recorded position.`);
        if (moveResult.san !== node.san) throw new Error(`Move history mismatch at ${node.moveNumber}${mover === 'w' ? '.' : '...'} ${node.san}.`);

        const fenAfter = chess.fen();
        const after = await searchPosition(fenAfter);
        if (runId !== runIdRef.current) return;

        const beforeCp = before.evaluation ? evaluationToCentipawns(before.evaluation) : null;
        const afterCp = after.evaluation ? evaluationToCentipawns(after.evaluation) : null;
        if (beforeCp === null || afterCp === null) {
          throw new Error(`Stockfish did not return a usable evaluation around ${node.moveNumber}${mover === 'w' ? '.' : '...'} ${node.san}.`);
        }
        if (!before.bestMoveUci || !before.evaluation?.bestMoveSan) {
          throw new Error(`Stockfish did not return a legal best move before ${node.san}.`);
        }

        const playedMoveUci = `${moveResult.from}${moveResult.to}${moveResult.promotion || ''}`;
        const loss = playedMoveUci === before.bestMoveUci ? 0 : evaluationLoss(beforeCp, afterCp, mover);
        const result: GameAnalysisMove = {
          nodeId: node.id,
          moveNumber: node.moveNumber,
          color: mover,
          playedMoveSan: moveResult.san,
          playedMoveUci,
          bestMoveSan: before.evaluation.bestMoveSan,
          bestMoveUci: before.bestMoveUci,
          scoreBeforeCp: beforeCp,
          scoreAfterCp: afterCp,
          evaluationBefore: getEvaluationDisplay(before.evaluation),
          evaluationAfter: getEvaluationDisplay(after.evaluation!),
          centipawnLoss: loss,
          classification: playedMoveUci === before.bestMoveUci ? 'best' : classifyCentipawnLoss(loss),
          fenBefore,
          fenAfter,
        };
        analyzed.push(result);
        setMoves([...analyzed]);
        setPoints((current) => [...current, {
          position: index + 1,
          moveLabel: `${node.moveNumber}${mover === 'w' ? '.' : '...'} ${moveResult.san}`,
          scoreCp: afterCp,
          evaluation: getEvaluationDisplay(after.evaluation!),
          nodeId: node.id,
        }]);
        setProgress({ completed: index + 1, total: mainline.length });
        before = after;
      }

      if (runId === runIdRef.current) setStatus('completed');
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      const message = caught instanceof Error ? caught.message : String(caught);
      if (message === 'Analysis cancelled.') {
        setStatus('cancelled');
      } else {
        setError(message);
        setStatus('error');
      }
    } finally {
      if (runId === runIdRef.current) {
        service.terminate();
        serviceRef.current = null;
        activeFenRef.current = null;
        resolveSearchRef.current = null;
        rejectSearchRef.current = null;
      }
    }
  }, [cancelAnalysis]);

  return { status, error, moves, points, progress, analyzeGame, cancelAnalysis };
};