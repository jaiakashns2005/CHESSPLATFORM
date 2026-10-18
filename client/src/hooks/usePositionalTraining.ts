import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { useStockfish } from './useStockfish';
import { positionalAccuracy, recordPositionalAttempt, EMPTY_POSITIONAL_PROGRESS } from '../core/positional/positionalProgress';
import { getPositionalFen } from '../core/positional/positionCatalog';
import { ChessSquare, BoardOrientation, PieceColor } from '../types/chess';
import { PositionalChallenge, PositionalDifficulty, PositionTrainingProgress, PositionalAttemptStatus } from '../types/positional';

const STORAGE_KEY = 'chess-platform-positional-progress-v1';

const readProgress = (): PositionTrainingProgress => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as PositionTrainingProgress | null;
    if (stored && Number.isFinite(stored.score) && stored.progress && Number.isFinite(stored.progress.attempted)) return stored;
  } catch {
    // Start clean if the browser cannot read saved practice progress.
  }
  return EMPTY_POSITIONAL_PROGRESS;
};

const depthForDifficulty: Record<PositionalDifficulty, number> = {
  beginner: 10,
  intermediate: 13,
  advanced: 16,
};

export const usePositionalTraining = (challenge: PositionalChallenge, difficulty: PositionalDifficulty) => {
  const challengeFen = useMemo(() => getPositionalFen(challenge), [challenge]);
  const [boardFen, setBoardFen] = useState(challengeFen);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [status, setStatus] = useState<PositionalAttemptStatus>('loading');
  const [message, setMessage] = useState('Choose the strongest positional move.');
  const [hintLevel, setHintLevel] = useState(0);
  const [progress, setProgress] = useState<PositionTrainingProgress>(readProgress);
  const [revealedMove, setRevealedMove] = useState<{ uci: string; san: string } | null>(null);
  const chessRef = useRef(new Chess(challengeFen));
  const attemptedRef = useRef(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const engine = useStockfish(challengeFen, { initialDepth: depthForDifficulty[difficulty], initialMultiPv: 1, autoStart: true });
  const targetDepth = depthForDifficulty[difficulty];

  useEffect(() => {
    engine.setDepth(targetDepth);
  }, [engine.setDepth, targetDepth]);

  useEffect(() => {
    chessRef.current = new Chess(challengeFen);
    setBoardFen(challengeFen);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setStatus('loading');
    setMessage('Choose the strongest positional move.');
    setHintLevel(0);
    attemptedRef.current = false;
    setRevealedMove(null);
  }, [challenge.id, challengeFen]);

  useEffect(() => {
    if (engine.status === 'ready' && engine.analysisFen === challengeFen && engine.settings.depth === targetDepth && engine.bestMoveUci) {
      setStatus((current) => current === 'loading' ? 'ready' : current);
    }
  }, [challengeFen, engine.analysisFen, engine.bestMoveUci, engine.settings.depth, engine.status, targetDepth]);

  const engineReady = engine.status === 'ready'
    && engine.analysisFen === challengeFen
    && engine.settings.depth === targetDepth
    && Boolean(engine.bestMoveUci && engine.bestMoveSan);
  const canPlay = status === 'ready' && engineReady;

  const saveAttempt = useCallback((solved: boolean) => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    const updated = recordPositionalAttempt(progressRef.current, challenge.category, solved);
    progressRef.current = updated;
    setProgress(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Progress remains available in memory if storage is blocked.
    }
  }, [challenge.category]);

  const submitMove = useCallback((from: ChessSquare, to: ChessSquare) => {
    if (!canPlay || !engine.bestMoveUci || !engine.bestMoveSan) return false;
    let played: Move;
    try {
      played = chessRef.current.move({ from: from as Square, to: to as Square });
    } catch {
      return false;
    }

    const playedUci = `${played.from}${played.to}${played.promotion || ''}`;
    const playedSan = played.san;
    chessRef.current.undo();
    const solved = playedUci === engine.bestMoveUci;
    const engineLine = { uci: engine.bestMoveUci, san: engine.bestMoveSan };
    setRevealedMove(engineLine);
    saveAttempt(solved);

    if (solved) {
      const applied = chessRef.current.move({ from: from as Square, to: to as Square });
      if (!applied) return false;
      setBoardFen(chessRef.current.fen());
      setLastMove({ from: applied.from as ChessSquare, to: applied.to as ChessSquare });
      setStatus('solved');
      setMessage(`Correct. Stockfish confirms ${engine.bestMoveSan} as its top move at depth ${targetDepth}.`);
    } else {
      setStatus('failed');
      setMessage(`${playedSan} is legal, but Stockfish prefers ${engine.bestMoveSan}. Review the positional idea and retry.`);
    }
    setSelectedSquare(null);
    setLegalMoves([]);
    return true;
  }, [canPlay, engine.bestMoveSan, engine.bestMoveUci, saveAttempt, targetDepth]);

  const legalDestinations = useCallback((square: ChessSquare) =>
    (chessRef.current.moves({ square: square as Square, verbose: true }) as Move[]).map((move) => move.to as ChessSquare), []);

  const handleSquareClick = useCallback((square: ChessSquare) => {
    if (!canPlay) return;
    if (selectedSquare && legalMoves.includes(square)) {
      submitMove(selectedSquare, square);
      return;
    }
    const piece = chessRef.current.get(square as Square);
    if (piece?.color === chessRef.current.turn()) {
      setSelectedSquare(square);
      setLegalMoves(legalDestinations(square));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [canPlay, legalDestinations, legalMoves, selectedSquare, submitMove]);

  const handleDropMove = useCallback((from: ChessSquare, to: ChessSquare) => {
    if (!canPlay || !legalDestinations(from).includes(to)) return;
    submitMove(from, to);
  }, [canPlay, legalDestinations, submitMove]);

  const showHint = useCallback(() => {
    if (!canPlay) return;
    const nextLevel = Math.min(2, hintLevel + 1);
    setHintLevel(nextLevel);
    setMessage(nextLevel === 1 ? challenge.hint : challenge.deeperHint);
  }, [canPlay, challenge.deeperHint, challenge.hint, hintLevel]);

  const retry = useCallback(() => {
    chessRef.current = new Chess(challengeFen);
    setBoardFen(challengeFen);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setStatus(engineReady ? 'ready' : 'loading');
    setMessage(engineReady ? 'Try again. Choose Stockfish’s strongest positional move.' : 'Waiting for Stockfish to analyze this position.');
    setHintLevel(0);
    attemptedRef.current = false;
    setRevealedMove(null);
  }, [challengeFen, engineReady]);

  const newPosition = retry;
  const turn: PieceColor = boardFen.split(' ')[1] === 'b' ? 'b' : 'w';
  const orientation: BoardOrientation = turn === 'b' ? 'black' : 'white';
  const isCheck = useMemo(() => chessRef.current.inCheck(), [boardFen]);
  const accuracy = positionalAccuracy(progress.progress.attempted, progress.progress.solved);
  const categoryProgress = progress.progress.byCategory[challenge.category] || { attempted: 0, solved: 0 };

  return {
    challengeFen,
    boardFen,
    turn,
    orientation,
    isCheck,
    selectedSquare,
    legalMoves,
    lastMove,
    status,
    message,
    hintLevel,
    canPlay,
    engineReady,
    engineStatus: engine.status,
    engineAnalysisFen: engine.analysisFen,
    engineError: engine.error,
    engineDepth: targetDepth,
    evaluation: engine.topEvaluation,
    engineBestMoveSan: engine.bestMoveSan,
    engineBestMoveUci: engine.bestMoveUci,
    revealedMove,
    progress: progress.progress,
    score: progress.score,
    accuracy,
    categoryProgress,
    handleSquareClick,
    handleDropMove,
    showHint,
    retry,
    newPosition,
    restartEngine: engine.restartEngine,
  };
};