import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { StockfishService } from '../core/engine/stockfishService';
import { createEndgameChallenge, endgamePositionKey, ENDGAME_POSITION_BANK, generateEndgameCandidate, validateEndgameMove } from '../core/endgame/endgamePositions';
import { EMPTY_ENDGAME_PROGRESS, getEndgameDifficulty, getEndgameSearchDepth, recordEndgameResult } from '../core/endgame/endgameProgress';
import { BoardOrientation, ChessSquare, PieceColor, PieceType } from '../types/chess';
import { EngineEvaluation, EngineStatus } from '../types/engine';
import { EndgameCategory, EndgameChallenge, EndgameProgress, EndgameStatus, ENDGAME_CATEGORIES } from '../types/endgame';

const PROGRESS_STORAGE_KEY = 'chess-platform-endgame-progress-v1';
const SESSION_STORAGE_KEY = 'chess-platform-endgame-session-v1';
const ALL_CATEGORIES = 'All Endgames';

interface SavedEndgameSession {
  challenge: EndgameChallenge;
  boardFen: string;
  status: EndgameStatus;
  seenPositions: string[];
  solutionRevealed: boolean;
  remainingSeconds?: number;
}

const readProgress = (): EndgameProgress => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || 'null') as Partial<EndgameProgress> | null;
    if (parsed && ['attempted', 'solved', 'currentStreak', 'bestStreak', 'score', 'adaptiveRating'].every((key) => Number.isFinite(parsed[key as keyof EndgameProgress])) && parsed.byCategory && typeof parsed.byCategory === 'object') {
      return parsed as EndgameProgress;
    }
  } catch {
    // Start clean when local progress is unavailable.
  }
  return EMPTY_ENDGAME_PROGRESS;
};

const readSession = (): SavedEndgameSession | null => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null') as Partial<SavedEndgameSession> | null;
    if (!session?.challenge || !session.boardFen || !session.seenPositions || !['playing', 'solved', 'failed'].includes(session.status || '')) return null;
    new Chess(session.challenge.fen);
    new Chess(session.boardFen);
    if (!validateEndgameMove(session.challenge.fen, session.challenge.solutionUci, session.challenge.solutionUci)) return null;
    if (!ENDGAME_CATEGORIES.includes(session.challenge.category)) return null;
    return session as SavedEndgameSession;
  } catch {
    // Start a fresh generated endgame when saved session data is invalid.
  }
  return null;
};

const formatUci = (move: Move): string => `${move.from}${move.to}${move.promotion || ''}`;

export const useEndgameTraining = () => {
  const [savedSession] = useState(readSession);
  const [storedProgress] = useState(readProgress);
  const [progress, setProgress] = useState(storedProgress);
  const [challenge, setChallenge] = useState<EndgameChallenge | null>(savedSession?.challenge || null);
  const [boardFen, setBoardFen] = useState(savedSession?.boardFen || ENDGAME_POSITION_BANK[0].fen);
  const [status, setStatus] = useState<EndgameStatus>(savedSession?.status || 'playing');
  const [selectedCategory, setSelectedCategory] = useState<typeof ALL_CATEGORIES | EndgameCategory>(ALL_CATEGORIES);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [message, setMessage] = useState('Find the strongest endgame move.');
  const [hintLevel, setHintLevel] = useState(0);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('uninitialized');
  const [engineError, setEngineError] = useState<string | null>(null);
  const [engineResult, setEngineResult] = useState<{ evaluation: EngineEvaluation | null; bestMove: string | null } | null>(null);
  const [engineReady, setEngineReady] = useState(!savedSession);
  const [isGenerating, setIsGenerating] = useState(!savedSession);
  const [remainingSeconds, setRemainingSeconds] = useState(savedSession?.remainingSeconds ?? savedSession?.challenge.timeLimitSeconds ?? 120);
  const [solutionRevealed, setSolutionRevealed] = useState(savedSession?.solutionRevealed || false);

  const chessRef = useRef(new Chess(boardFen));
  const challengeRef = useRef(challenge);
  const progressRef = useRef(progress);
  const statusRef = useRef(status);
  const attemptRecordedRef = useRef(status !== 'playing');
  const solutionRevealedRef = useRef(solutionRevealed);
  const seenPositionsRef = useRef(new Set(savedSession?.seenPositions || []));
  const generationTokenRef = useRef(0);
  const serviceRef = useRef<StockfishService | null>(null);
  const evaluationRef = useRef<EngineEvaluation | null>(null);
  const remainingSecondsRef = useRef(remainingSeconds);
  const resumeValidationRef = useRef(Boolean(savedSession));
  challengeRef.current = challenge;
  progressRef.current = progress;
  statusRef.current = status;
  solutionRevealedRef.current = solutionRevealed;
  remainingSecondsRef.current = remainingSeconds;

  const persistProgress = useCallback((nextProgress: EndgameProgress) => {
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress));
    } catch {
      // Keep updated progress in memory if browser storage is blocked.
    }
  }, []);

  const setPosition = useCallback((nextChallenge: EndgameChallenge) => {
    const initialGame = new Chess(nextChallenge.fen);
    challengeRef.current = nextChallenge;
    setChallenge(nextChallenge);
    chessRef.current = initialGame;
    setBoardFen(initialGame.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setStatus('playing');
    statusRef.current = 'playing';
    setMessage('Find the strongest endgame move.');
    setHintLevel(0);
    setRemainingSeconds(nextChallenge.timeLimitSeconds);
    setSolutionRevealed(false);
    solutionRevealedRef.current = false;
    attemptRecordedRef.current = false;
    setEngineError(null);
    setEngineResult(null);
  }, []);

  const finishAttempt = useCallback((solved: boolean) => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge || attemptRecordedRef.current) return;
    attemptRecordedRef.current = true;
    statusRef.current = solved ? 'solved' : 'failed';
    setStatus(solved ? 'solved' : 'failed');
    setMessage(solved
      ? `Correct. ${currentChallenge.solutionSan} is Stockfish’s top move. ${currentChallenge.explanation}`
      : `Not quite. Stockfish recommends ${currentChallenge.solutionSan}. ${currentChallenge.explanation}`);
    persistProgress(recordEndgameResult(progressRef.current, currentChallenge.category, solved, remainingSecondsRef.current));
  }, [persistProgress]);

  const applyMove = useCallback((uci: string) => {
    const applied = chessRef.current.move({
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: uci[4],
    });
    if (!applied) return false;
    setBoardFen(chessRef.current.fen());
    setLastMove({ from: applied.from as ChessSquare, to: applied.to as ChessSquare });
    setSelectedSquare(null);
    setLegalMoves([]);
    return true;
  }, []);

  const submitMove = useCallback((from: ChessSquare, to: ChessSquare, promotion?: PieceType) => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge || status !== 'playing' || !engineReady || isGenerating || chessRef.current.turn() !== currentChallenge.playerColor) return false;
    let move: Move;
    try {
      move = chessRef.current.move({ from: from as Square, to: to as Square, promotion });
    } catch {
      return false;
    }
    const playedUci = formatUci(move);
    chessRef.current.undo();
    if (!validateEndgameMove(currentChallenge.fen, currentChallenge.solutionUci, playedUci)) {
      const legal = new Chess(currentChallenge.fen).moves({ verbose: true }).some((candidate) => formatUci(candidate) === playedUci);
      if (!legal) return false;
      applyMove(playedUci);
      finishAttempt(false);
      return true;
    }
    applyMove(playedUci);
    finishAttempt(true);
    return true;
  }, [applyMove, engineReady, finishAttempt, isGenerating, status]);

  const getLegalMoves = useCallback((square: ChessSquare) => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge || status !== 'playing' || !engineReady || isGenerating || chessRef.current.turn() !== currentChallenge.playerColor) return [];
    return (chessRef.current.moves({ square: square as Square, verbose: true }) as Move[]).map((move) => move.to as ChessSquare);
  }, [engineReady, isGenerating, status]);

  const handleSquareClick = useCallback((square: ChessSquare) => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge || status !== 'playing' || !engineReady || isGenerating) return;
    if (selectedSquare && legalMoves.includes(square)) {
      const piece = chessRef.current.get(selectedSquare as Square);
      const promotion = piece?.type === 'p' && (square[1] === '1' || square[1] === '8') ? 'q' : undefined;
      submitMove(selectedSquare, square, promotion);
      return;
    }
    if (chessRef.current.get(square as Square)?.color === currentChallenge.playerColor) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMoves(square));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [engineReady, getLegalMoves, isGenerating, legalMoves, selectedSquare, status, submitMove]);

  const handleDropMove = useCallback((from: ChessSquare, to: ChessSquare, promotion?: PieceType) => {
    if (!getLegalMoves(from).includes(to)) return;
    submitMove(from, to, promotion);
  }, [getLegalMoves, submitMove]);

  const nextEndgame = useCallback((category?: EndgameCategory | typeof ALL_CATEGORIES) => {
    if (statusRef.current === 'playing' && challengeRef.current) finishAttempt(false);
    setIsGenerating(true);
    setEngineReady(false);
    setEngineError(null);
    const token = ++generationTokenRef.current;
    serviceRef.current?.terminate();
    serviceRef.current = null;
    const preferredCategory = category === ALL_CATEGORIES ? undefined : category || (selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory);
    const difficulty = getEndgameDifficulty(progressRef.current.adaptiveRating);
    const depth = getEndgameSearchDepth(progressRef.current.adaptiveRating);
    let candidate = generateEndgameCandidate(seenPositionsRef.current, Math.random, preferredCategory);
    let evaluation: EngineEvaluation | null = null;
    let failed = false;
    let service: StockfishService;

    const fail = (error: string) => {
      if (failed || token !== generationTokenRef.current) return;
      failed = true;
      serviceRef.current?.terminate();
      serviceRef.current = null;
      setIsGenerating(false);
      setEngineError(error);
    };

    const analyzeCandidate = () => service.startAnalysis(candidate.fen, depth, 1);
    service = new StockfishService({
      onStatusChange: setEngineStatus,
      onEvaluationUpdate: (lines) => { evaluation = lines.find((line) => line.multipv === 1) || evaluation; },
      onSearchComplete: (fen, bestMove) => {
        if (token !== generationTokenRef.current || failed || fen !== candidate.fen) return;
        const generated = createEndgameChallenge(candidate, difficulty, bestMove);
        if (!generated || seenPositionsRef.current.has(endgamePositionKey(generated.fen))) {
          try {
            candidate = generateEndgameCandidate(seenPositionsRef.current, Math.random, preferredCategory);
            evaluation = null;
            analyzeCandidate();
          } catch (error) {
            fail(String(error));
          }
          return;
        }
        failed = true;
        seenPositionsRef.current.add(endgamePositionKey(generated.fen));
        setPosition(generated);
        setEngineResult({ evaluation, bestMove });
        setEngineReady(true);
        setIsGenerating(false);
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            challenge: generated,
            boardFen: generated.fen,
            status: 'playing',
            seenPositions: [...seenPositionsRef.current],
            solutionRevealed: false,
            remainingSeconds: generated.timeLimitSeconds,
          } satisfies SavedEndgameSession));
        } catch {
          // Continue the current session without persistence when storage is unavailable.
        }
        service.terminate();
        if (serviceRef.current === service) serviceRef.current = null;
      },
      onError: (error) => fail(`Stockfish could not validate this endgame: ${error}`),
    });
    serviceRef.current = service;
    analyzeCandidate();
  }, [finishAttempt, selectedCategory, setPosition, status]);

  const retry = useCallback(() => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge) return;
    const initialGame = new Chess(currentChallenge.fen);
    chessRef.current = initialGame;
    setBoardFen(initialGame.fen());
    setLastMove(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setStatus('playing');
    statusRef.current = 'playing';
    setMessage('Try the endgame again.');
    setHintLevel(0);
    setSolutionRevealed(false);
    solutionRevealedRef.current = false;
    attemptRecordedRef.current = false;
    setRemainingSeconds(currentChallenge.timeLimitSeconds);
    setEngineError(null);
    setEngineReady(true);
  }, []);

  const requestHint = useCallback(() => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge || status !== 'playing' || !engineReady || isGenerating) return;
    const nextLevel = Math.min(2, hintLevel + 1);
    setHintLevel(nextLevel);
    setMessage(nextLevel === 1
      ? currentChallenge.hint
      : `The engine’s move is ${currentChallenge.solutionSan} (${currentChallenge.solutionUci.slice(0, 2)} to ${currentChallenge.solutionUci.slice(2, 4)}).`);
  }, [engineReady, hintLevel, isGenerating, status]);

  const showSolution = useCallback(() => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge || status !== 'playing') return;
    applyMove(currentChallenge.solutionUci);
    setSolutionRevealed(true);
    solutionRevealedRef.current = true;
    finishAttempt(false);
  }, [applyMove, finishAttempt, status]);

  const selectCategory = useCallback((category: typeof ALL_CATEGORIES | EndgameCategory) => {
    setSelectedCategory(category);
    nextEndgame(category === ALL_CATEGORIES ? undefined : category);
  }, [nextEndgame]);

  useEffect(() => {
    if (!savedSession) nextEndgame();
  }, [nextEndgame, savedSession]);

  useEffect(() => () => {
    generationTokenRef.current += 1;
    serviceRef.current?.terminate();
    serviceRef.current = null;
  }, []);

  useEffect(() => {
    if (!challenge) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        challenge,
        boardFen,
        status,
        seenPositions: [...seenPositionsRef.current],
        solutionRevealed,
        remainingSeconds,
      } satisfies SavedEndgameSession));
    } catch {
      // Keep the active training state in memory when storage is unavailable.
    }
  }, [boardFen, challenge, remainingSeconds, solutionRevealed, status]);

  useEffect(() => {
    if (status !== 'playing' || isGenerating) return;
    const timer = setInterval(() => setRemainingSeconds((current) => {
      if (current <= 1) {
        clearInterval(timer);
        finishAttempt(false);
        setMessage(`Time expired. ${challengeRef.current?.solutionSan || 'Review the solution'} and try another endgame.`);
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [finishAttempt, isGenerating, status]);

  useEffect(() => {
    if (!resumeValidationRef.current || !challenge) return;
    resumeValidationRef.current = false;
    setEngineReady(false);
    let active = true;
    const restoredChallenge = challenge;
    const service = new StockfishService({
      onStatusChange: setEngineStatus,
      onEvaluationUpdate: (lines) => { evaluationRef.current = lines.find((line) => line.multipv === 1) || null; },
      onSearchComplete: (fen, bestMove) => {
        if (!active || fen !== restoredChallenge.fen) return;
        if (!bestMove) {
          setEngineError('Stockfish returned no legal move for the saved endgame.');
          return;
        }
        const validated = createEndgameChallenge(restoredChallenge, getEndgameDifficulty(progressRef.current.adaptiveRating), bestMove);
        if (!validated) {
          setEngineError('Stockfish returned a move that is not legal in the saved endgame.');
          return;
        }
        const nextChallenge = { ...validated, id: restoredChallenge.id };
        challengeRef.current = nextChallenge;
        setChallenge(nextChallenge);
        setEngineResult({ evaluation: evaluationRef.current, bestMove });
        setEngineReady(true);
        service.terminate();
      },
      onError: setEngineError,
    });
    serviceRef.current = service;
    service.startAnalysis(restoredChallenge.fen, getEndgameSearchDepth(progressRef.current.adaptiveRating), 1);
    return () => {
      active = false;
      service.terminate();
      if (serviceRef.current === service) serviceRef.current = null;
    };
  }, [challenge]);

  const currentTurn = chessRef.current.turn() as PieceColor;
  const isCheck = useMemo(() => chessRef.current.inCheck(), [boardFen]);
  const orientation: BoardOrientation = challenge?.playerColor === 'b' ? 'black' : 'white';
  const accuracy = progress.attempted === 0 ? 0 : Math.round((progress.solved / progress.attempted) * 100);
  const categoryProgress = useMemo(() => ENDGAME_CATEGORIES.map((category) => ({
    category,
    ...(progress.byCategory[category] || { attempted: 0, solved: 0 }),
  })), [progress.byCategory]);

  return {
    challenge,
    boardFen,
    currentTurn,
    orientation,
    isCheck,
    selectedSquare,
    legalMoves,
    lastMove,
    status,
    message,
    hintLevel,
    remainingSeconds,
    progress,
    accuracy,
    categoryProgress,
    selectedCategory,
    allCategoriesLabel: ALL_CATEGORIES,
    engineStatus,
    engineError,
    engineResult,
    engineReady,
    isGenerating,
    solutionRevealed,
    handleSquareClick,
    handleDropMove,
    requestHint,
    showSolution,
    retry,
    nextEndgame,
    selectCategory,
  };
};
