import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { StockfishService } from '../core/engine/stockfishService';
import {
  createEnginePuzzle,
  createPuzzleCandidate,
  getPuzzlePositionKey,
  PUZZLES,
  validatePuzzle,
} from '../core/puzzles/puzzleBank';
import {
  EMPTY_PUZZLE_STATS,
  getAdaptiveDifficulty,
  getAdaptiveSearchDepth,
  getPuzzleAccuracy,
  MAX_ADAPTIVE_RATING,
  MIN_ADAPTIVE_RATING,
  recordPuzzleResult,
  updateAdaptiveRating,
} from '../core/puzzles/puzzleProgress';
import { BoardOrientation, ChessSquare, PieceColor, PieceType } from '../types/chess';
import { EngineEvaluation, EngineStatus } from '../types/engine';
import { ChessPuzzle, PuzzleDifficulty, PuzzleStats, PuzzleStatus } from '../types/puzzle';

const STATS_STORAGE_KEY = 'chess-platform-puzzle-stats-v1';
const SESSION_STORAGE_KEY = 'chess-platform-puzzle-session-v1';
const formatUci = (move: Move) => `${move.from}${move.to}${move.promotion || ''}`;

interface PuzzleSession {
  difficulty: PuzzleDifficulty;
  puzzle: ChessPuzzle;
  seenKeys: string[];
  status?: PuzzleStatus;
  fen?: string;
  solutionIndex?: number;
  remainingSeconds?: number;
  attemptRecorded?: boolean;
  adaptiveRating?: number;
}

const readPuzzleSession = (): PuzzleSession | null => {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null') as Partial<PuzzleSession> | null;
    if (stored && ['easy', 'medium', 'hard'].includes(stored.difficulty || '') && stored.puzzle && !PUZZLES.some((puzzle) => puzzle.id === stored.puzzle?.id) && validatePuzzle(stored.puzzle) && Array.isArray(stored.seenKeys)) {
      if (stored.status && !['playing', 'completed', 'failed'].includes(stored.status)) return null;
      if (stored.adaptiveRating !== undefined && (!Number.isFinite(stored.adaptiveRating) || stored.adaptiveRating < MIN_ADAPTIVE_RATING || stored.adaptiveRating > MAX_ADAPTIVE_RATING)) return null;
      if (stored.fen) new Chess(stored.fen);
      return stored as PuzzleSession;
    }
  } catch {
    // Start with a fresh puzzle if saved session data is unavailable.
  }
  return null;
};

const readStats = (): PuzzleStats => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || 'null') as Partial<PuzzleStats> | null;
    if (parsed && ['attempted', 'solved', 'currentStreak', 'bestStreak', 'score'].every((key) => Number.isFinite(parsed[key as keyof PuzzleStats]))) {
      return parsed as PuzzleStats;
    }
  } catch {
    // Use a clean session if stored progress is unavailable.
  }
  return EMPTY_PUZZLE_STATS;
};

export const usePuzzleTraining = () => {
  const [savedSession] = useState(readPuzzleSession);
  const [adaptiveRating, setAdaptiveRating] = useState(savedSession?.adaptiveRating ?? MIN_ADAPTIVE_RATING);
  const [puzzle, setPuzzle] = useState<ChessPuzzle>(savedSession?.puzzle || PUZZLES[0]);
  const [fen, setFen] = useState(savedSession?.fen || puzzle.fen);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [status, setStatus] = useState<PuzzleStatus>(savedSession?.status || 'playing');
  const [message, setMessage] = useState('Find the best move.');
  const [hintLevel, setHintLevel] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(savedSession?.remainingSeconds ?? puzzle.timeLimitSeconds);
  const [stats, setStats] = useState<PuzzleStats>(readStats);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('uninitialized');
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineResult, setEngineResult] = useState<{ evaluation: EngineEvaluation | null; bestMove: string | null } | null>(null);
  const [isGenerating, setIsGenerating] = useState(!savedSession);
  const [orientation, setOrientation] = useState<BoardOrientation>(puzzle.playerColor === 'w' ? 'white' : 'black');

  const chessRef = useRef<Chess>(new Chess(fen));
  const solutionIndexRef = useRef(savedSession?.solutionIndex ?? 0);
  const attemptRecordedRef = useRef(savedSession?.attemptRecorded ?? status !== 'playing');
  const adaptiveRatingRef = useRef(adaptiveRating);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatorRef = useRef<StockfishService | null>(null);
  const generationTokenRef = useRef(0);
  const seenPuzzleKeysRef = useRef(new Set([...(savedSession?.seenKeys || []), getPuzzlePositionKey(savedSession?.puzzle || PUZZLES[0])]));
  const serviceRef = useRef<StockfishService | null>(null);
  const latestEvaluationRef = useRef<EngineEvaluation | null>(null);
  const remainingSecondsRef = useRef(remainingSeconds);
  remainingSecondsRef.current = remainingSeconds;
  adaptiveRatingRef.current = adaptiveRating;

  const setPuzzleState = useCallback((nextPuzzle: ChessPuzzle) => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    setPuzzle(nextPuzzle);
    seenPuzzleKeysRef.current.add(getPuzzlePositionKey(nextPuzzle));
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        difficulty: nextPuzzle.difficulty,
        puzzle: nextPuzzle,
        seenKeys: [...seenPuzzleKeysRef.current],
        status: 'playing',
        fen: nextPuzzle.fen,
        solutionIndex: 0,
        remainingSeconds: nextPuzzle.timeLimitSeconds,
        attemptRecorded: false,
        adaptiveRating: adaptiveRatingRef.current,
      } satisfies PuzzleSession));
    } catch {
      // The active puzzle and seen set remain available in memory if storage is blocked.
    }
    chessRef.current = new Chess(nextPuzzle.fen);
    setFen(chessRef.current.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    solutionIndexRef.current = 0;
    attemptRecordedRef.current = false;
    setStatus('playing');
    setMessage('Find the best move.');
    setHintLevel(0);
    setRemainingSeconds(nextPuzzle.timeLimitSeconds);
    setEngineResult(null);
    setEngineError(null);
    setOrientation(nextPuzzle.playerColor === 'w' ? 'white' : 'black');
  }, []);

  const updateStats = useCallback((solved: boolean) => {
    if (attemptRecordedRef.current) return;
    attemptRecordedRef.current = true;
    const updatedRating = updateAdaptiveRating(adaptiveRatingRef.current, solved);
    adaptiveRatingRef.current = updatedRating;
    setAdaptiveRating(updatedRating);
    setStats((current) => {
      const updated = recordPuzzleResult(current, solved, remainingSecondsRef.current);
      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Progress remains available for this session if persistence is blocked.
      }
      return updated;
    });
  }, []);

  const finishPuzzle = useCallback((solved: boolean) => {
    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
    setStatus(solved ? 'completed' : 'failed');
    setMessage(solved ? 'Puzzle solved. Here is the complete line.' : 'Not the solution. Review the tactical line.');
    updateStats(solved);
  }, [updateStats]);

  const applySolutionMove = useCallback((uci: string) => {
    const move = chessRef.current.move({
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: uci[4],
    });
    if (!move) return false;
    setFen(chessRef.current.fen());
    setLastMove({ from: move.from as ChessSquare, to: move.to as ChessSquare });
    setSelectedSquare(null);
    setLegalMoves([]);
    return true;
  }, []);

  const submitMove = useCallback((from: ChessSquare, to: ChessSquare, promotion?: PieceType): boolean => {
    if (status !== 'playing' || chessRef.current.turn() !== puzzle.playerColor) return false;
    let move: Move;
    try {
      move = chessRef.current.move({ from: from as Square, to: to as Square, promotion });
    } catch {
      return false;
    }
    const userUci = formatUci(move);
    chessRef.current.undo();
    const expectedUci = puzzle.solutionUci[solutionIndexRef.current];

    if (userUci !== expectedUci) {
      setMessage('That is a legal move, but it misses the tactic.');
      finishPuzzle(false);
      return true;
    }

    if (!applySolutionMove(expectedUci)) return false;
    solutionIndexRef.current += 1;
    setMessage('Correct. The opponent replies automatically.');

    const opponentMove = puzzle.solutionUci[solutionIndexRef.current];
    if (opponentMove) {
      replyTimerRef.current = setTimeout(() => {
        if (!applySolutionMove(opponentMove)) {
          setEngineError('The stored puzzle reply was not legal in this position.');
          finishPuzzle(false);
          return;
        }
        solutionIndexRef.current += 1;
        if (solutionIndexRef.current >= puzzle.solutionUci.length) finishPuzzle(true);
        else setMessage('Opponent replied. Find the next move in the line.');
      }, 450);
    } else {
      finishPuzzle(true);
    }
    return true;
  }, [applySolutionMove, finishPuzzle, puzzle, status]);

  const getLegalMoves = useCallback((square: ChessSquare) => {
    if (status !== 'playing' || chessRef.current.turn() !== puzzle.playerColor) return [];
    return (chessRef.current.moves({ square: square as Square, verbose: true }) as Move[]).map((move) => move.to as ChessSquare);
  }, [puzzle.playerColor, status]);

  const handleSquareClick = useCallback((square: ChessSquare) => {
    if (status !== 'playing' || chessRef.current.turn() !== puzzle.playerColor) return;
    if (selectedSquare && legalMoves.includes(square)) {
      const movingPiece = chessRef.current.get(selectedSquare as Square);
      const promotion = movingPiece?.type === 'p' && (square[1] === '1' || square[1] === '8') ? 'q' : undefined;
      submitMove(selectedSquare, square, promotion);
      return;
    }
    const piece = chessRef.current.get(square as Square);
    if (piece?.color === puzzle.playerColor) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMoves(square));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [getLegalMoves, legalMoves, puzzle.playerColor, selectedSquare, status, submitMove]);

  const handleDropMove = useCallback((from: ChessSquare, to: ChessSquare, promotion?: PieceType) => {
    if (!getLegalMoves(from).includes(to)) return;
    const movingPiece = chessRef.current.get(from as Square);
    const selectedPromotion = promotion || (movingPiece?.type === 'p' && (to[1] === '1' || to[1] === '8') ? 'q' : undefined);
    submitMove(from, to, selectedPromotion);
  }, [getLegalMoves, submitMove]);

  const requestHint = useCallback(() => {
    if (status !== 'playing') return;
    setHintLevel((level) => Math.min(3, level + 1));
    setMessage(hintLevel === 0
      ? puzzle.hint
      : hintLevel === 1
        ? `The solution starts from ${puzzle.solutionUci[solutionIndexRef.current].slice(0, 2)}.`
        : `Look at ${puzzle.solutionUci[solutionIndexRef.current].slice(0, 2)} to ${puzzle.solutionUci[solutionIndexRef.current].slice(2, 4)}.`);
  }, [hintLevel, puzzle, status]);

  const newPuzzle = useCallback(() => {
    const nextDifficulty = getAdaptiveDifficulty(adaptiveRatingRef.current);
    setIsGenerating(true);
    setEngineError(null);
    const generationToken = ++generationTokenRef.current;
    generatorRef.current?.terminate();
    const depth = getAdaptiveSearchDepth(adaptiveRatingRef.current);
    let candidate = createPuzzleCandidate();
    let failed = false;

    const failGeneration = (error: string) => {
      if (failed || generationToken !== generationTokenRef.current) return;
      failed = true;
      generatorRef.current?.terminate();
      generatorRef.current = null;
      setIsGenerating(false);
      setEngineError(error);
    };

    let generator: StockfishService;
    generator = new StockfishService({
      onSearchComplete: (searchedFen, bestMove) => {
        if (generationToken !== generationTokenRef.current || failed || searchedFen !== candidate.fen) return;
        const generated = createEnginePuzzle(candidate, nextDifficulty, bestMove);
        if (!generated || seenPuzzleKeysRef.current.has(getPuzzlePositionKey(generated))) {
          candidate = createPuzzleCandidate();
          generator.startAnalysis(candidate.fen, depth, 1);
          return;
        }
        failed = true;
        generator.terminate();
        if (generatorRef.current === generator) generatorRef.current = null;
        setPuzzleState(generated);
        setIsGenerating(false);
      },
      onError: (error) => failGeneration(`Stockfish could not generate a puzzle: ${error}`),
    });
    generatorRef.current = generator;
    generator.startAnalysis(candidate.fen, depth, 1);
  }, [setPuzzleState]);

  const retryPuzzle = useCallback(() => setPuzzleState(puzzle), [puzzle, setPuzzleState]);
  const skipPuzzle = useCallback(() => {
    if (status === 'playing') finishPuzzle(false);
    newPuzzle();
  }, [finishPuzzle, newPuzzle, status]);

  useEffect(() => {
    if (!savedSession) newPuzzle();
  }, [newPuzzle, savedSession]);

  useEffect(() => () => {
    generationTokenRef.current += 1;
    generatorRef.current?.terminate();
    generatorRef.current = null;
  }, []);

  useEffect(() => {
    if (!savedSession && puzzle === PUZZLES[0]) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        difficulty: puzzle.difficulty,
        puzzle,
        seenKeys: [...seenPuzzleKeysRef.current],
        status,
        fen,
        solutionIndex: solutionIndexRef.current,
        remainingSeconds,
        attemptRecorded: attemptRecordedRef.current,
        adaptiveRating,
      } satisfies PuzzleSession));
    } catch {
      // Keep the active session in memory if browser storage is unavailable.
    }
  }, [adaptiveRating, fen, puzzle, remainingSeconds, status]);

  useEffect(() => {
    if (status !== 'playing' || isGenerating) return;
    const timer = setInterval(() => setRemainingSeconds((current) => {
      if (current <= 1) {
        clearInterval(timer);
        finishPuzzle(false);
        setMessage('Time expired. Review the solution and try another puzzle.');
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [finishPuzzle, isGenerating, status]);

  useEffect(() => {
    if (!savedSession && puzzle.id === PUZZLES[0].id) return;
    latestEvaluationRef.current = null;
    const service = new StockfishService({
      onStatusChange: setEngineStatus,
      onEvaluationUpdate: (lines) => { latestEvaluationRef.current = lines.find((line) => line.multipv === 1) || null; },
      onBestMove: (uci) => {
        setEngineResult((current) => ({ evaluation: latestEvaluationRef.current, bestMove: uci || current?.bestMove || null }));
      },
      onSearchComplete: (_fen, bestMove) => {
        setEngineResult({ evaluation: latestEvaluationRef.current, bestMove });
      },
      onError: setEngineError,
    });
    serviceRef.current = service;
    service.init();
    service.startAnalysis(puzzle.fen, 12, 1);
    return () => {
      service.terminate();
      if (serviceRef.current === service) serviceRef.current = null;
    };
  }, [puzzle.id, puzzle.fen, savedSession]);

  const turn: PieceColor = fen.split(' ')[1] === 'b' ? 'b' : 'w';
  const isCheck = useMemo(() => chessRef.current.inCheck(), [fen]);
  const solutionLine = useMemo(() => {
    const game = new Chess(puzzle.fen);
    return puzzle.solutionUci.map((uci) => {
      const move = game.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] });
      return move?.san || uci;
    }).join(' ');
  }, [puzzle]);

  return {
    puzzle,
    fen,
    turn,
    isCheck,
    selectedSquare,
    legalMoves,
    lastMove,
    orientation,
    status,
    message,
    hintLevel,
    remainingSeconds,
    stats,
    accuracy: getPuzzleAccuracy(stats),
    engineStatus,
    engineError,
    engineResult,
    isGenerating,
    solutionLine,
    handleSquareClick,
    handleDropMove,
    requestHint,
    newPuzzle,
    nextPuzzle: newPuzzle,
    retryPuzzle,
    skipPuzzle,
    showSolution: () => finishPuzzle(false),
    flipBoard: () => setOrientation((current) => current === 'white' ? 'black' : 'white'),
  };
};