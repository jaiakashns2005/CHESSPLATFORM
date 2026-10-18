import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { ChessSquare, BoardOrientation, PieceColor } from '../types/chess';
import { OpeningLine, OpeningTrainingProgress } from '../types/opening';
import { replayOpening } from '../core/openings/openingRepertoire';
import { recordOpeningCompleted, recordOpeningMove, toggleOpeningFavorite } from '../core/openings/openingProgress';
import { STARTING_FEN } from '../utils/chessUtils';

const STORAGE_KEY = 'chess-platform-opening-progress-v1';
const EMPTY_PROGRESS: OpeningTrainingProgress = { favorites: [], byOpening: {} };

const readProgress = (): OpeningTrainingProgress => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored && Array.isArray(stored.favorites) && stored.byOpening && typeof stored.byOpening === 'object') return stored;
  } catch {
    // Start with empty progress if browser storage is unavailable.
  }
  return EMPTY_PROGRESS;
};

export const useOpeningTraining = (opening: OpeningLine) => {
  const plies = useMemo(() => replayOpening(opening), [opening]);
  const [mode, setMode] = useState<'explore' | 'practice'>('explore');
  const [practiceColor, setPracticeColor] = useState<PieceColor>(opening.practiceColor);
  const [fen, setFen] = useState(STARTING_FEN);
  const [cursor, setCursor] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [message, setMessage] = useState('Explore the move list or start practicing this line.');
  const [feedback, setFeedback] = useState<'neutral' | 'correct' | 'incorrect' | 'complete'>('neutral');
  const [progress, setProgress] = useState(readProgress);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const chessRef = useRef(new Chess(STARTING_FEN));
  const cursorRef = useRef(0);
  const completedRef = useRef(false);

  const persist = useCallback((next: typeof EMPTY_PROGRESS) => {
    progressRef.current = next;
    setProgress(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep updated progress in memory when local storage is blocked.
    }
  }, []);

  const setPositionAt = useCallback((nextCursor: number) => {
    const nextGame = new Chess(STARTING_FEN);
    for (let index = 0; index < nextCursor; index += 1) {
      const ply = plies[index];
      nextGame.move({ from: ply.from as Square, to: ply.to as Square, promotion: ply.uci[4] });
    }
    chessRef.current = nextGame;
    cursorRef.current = nextCursor;
    setCursor(nextCursor);
    setFen(nextGame.fen());
    const previous = nextCursor > 0 ? plies[nextCursor - 1] : null;
    setLastMove(previous ? { from: previous.from, to: previous.to } : null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [plies]);

  useEffect(() => {
    setPositionAt(0);
    setMode('explore');
    setPracticeColor(opening.practiceColor);
    setMessage('Explore the move list or start practicing this line.');
    setFeedback('neutral');
    completedRef.current = false;
  }, [opening.id, opening.practiceColor, setPositionAt]);

  const markCompleted = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    persist(recordOpeningCompleted(progressRef.current, opening.id));
    setFeedback('complete');
    setMessage(`Line complete: ${opening.name} - ${opening.variation}.`);
  }, [opening.id, opening.name, opening.variation, persist, progress]);

  const playBookReplies = useCallback((startAt: number) => {
    let nextCursor = startAt;
    while (nextCursor < plies.length && plies[nextCursor].color !== practiceColor) {
      const ply = plies[nextCursor];
      chessRef.current.move({ from: ply.from as Square, to: ply.to as Square, promotion: ply.uci[4] });
      nextCursor += 1;
    }
    cursorRef.current = nextCursor;
    setCursor(nextCursor);
    setFen(chessRef.current.fen());
    const previous = nextCursor > 0 ? plies[nextCursor - 1] : null;
    setLastMove(previous ? { from: previous.from, to: previous.to } : null);
    if (nextCursor >= plies.length) markCompleted();
  }, [markCompleted, plies, practiceColor]);

  const startPractice = useCallback((color: PieceColor = practiceColor) => {
    setPracticeColor(color);
    setMode('practice');
    setFeedback('neutral');
    completedRef.current = false;
    setMessage(color === 'w' ? 'Find White’s first move.' : 'Black to move: find the reply to White’s first move.');
    setPositionAt(0);
    if (plies.length > 0 && plies[0].color !== color) {
      const first = plies[0];
      chessRef.current.move({ from: first.from as Square, to: first.to as Square, promotion: first.uci[4] });
      cursorRef.current = 1;
      setCursor(1);
      setFen(chessRef.current.fen());
      setLastMove({ from: first.from, to: first.to });
    }
  }, [plies, practiceColor, setPositionAt]);

  const getLegalDestinations = useCallback((square: ChessSquare) =>
    (chessRef.current.moves({ square: square as Square, verbose: true }) as Move[]).map((move) => move.to as ChessSquare), []);

  const submitMove = useCallback((from: ChessSquare, to: ChessSquare) => {
    if (mode !== 'practice' || feedback === 'complete' || chessRef.current.turn() !== practiceColor) return false;
    let move: Move;
    try {
      move = chessRef.current.move({ from: from as Square, to: to as Square });
    } catch {
      return false;
    }
    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;
    chessRef.current.undo();
    const expected = plies[cursorRef.current];
    if (!expected || playedUci !== expected.uci) {
      persist(recordOpeningMove(progress, opening.id, false));
      setFeedback('incorrect');
      setMessage(expected ? `Not that move. The opening continues with ${expected.san}. Try again.` : 'This line has no further moves. Restart to practice it again.');
      return true;
    }

    chessRef.current.move({ from: expected.from as Square, to: expected.to as Square, promotion: expected.uci[4] });
    const nextCursor = cursorRef.current + 1;
    persist(recordOpeningMove(progress, opening.id, true));
    setFeedback('correct');
    setMessage(`Correct: ${expected.san}. Opponent’s book reply played.`);
    playBookReplies(nextCursor);
    return true;
  }, [feedback, mode, opening.id, persist, plies, playBookReplies, practiceColor, progress]);

  const handleSquareClick = useCallback((square: ChessSquare) => {
    if (mode !== 'practice' || feedback === 'complete' || chessRef.current.turn() !== practiceColor) return;
    if (selectedSquare && legalMoves.includes(square)) {
      submitMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }
    const piece = chessRef.current.get(square as Square);
    if (piece?.color === practiceColor) {
      setSelectedSquare(square);
      setLegalMoves(getLegalDestinations(square));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [feedback, getLegalDestinations, legalMoves, mode, practiceColor, selectedSquare, submitMove]);

  const handleDropMove = useCallback((from: ChessSquare, to: ChessSquare) => {
    if (!getLegalDestinations(from).includes(to)) return;
    submitMove(from, to);
  }, [getLegalDestinations, submitMove]);

  const explorePly = useCallback((plyCount: number) => {
    setMode('explore');
    setFeedback('neutral');
    completedRef.current = false;
    setPositionAt(Math.max(0, Math.min(plies.length, plyCount)));
    setMessage(plyCount === 0 ? 'Starting position.' : `Position after ${plies[plyCount - 1]?.san || 'opening move'}.`);
  }, [plies, setPositionAt]);

  const toggleFavorite = useCallback((openingId: string = opening.id) => {
    persist(toggleOpeningFavorite(progress, openingId));
  }, [opening.id, persist, progress]);

  const restart = useCallback(() => startPractice(practiceColor), [practiceColor, startPractice]);
  const orientation: BoardOrientation = practiceColor === 'b' && mode === 'practice' ? 'black' : 'white';
  const isCheck = useMemo(() => chessRef.current.inCheck(), [fen]);
  const currentPly = cursor > 0 ? plies[cursor - 1] : null;

  return {
    plies,
    mode,
    practiceColor,
    fen,
    turn: chessRef.current.turn() as PieceColor,
    isCheck,
    orientation,
    selectedSquare,
    legalMoves,
    lastMove,
    cursor,
    message,
    feedback,
    progress,
    currentPly,
    startPractice,
    restart,
    explorePly,
    handleSquareClick,
    handleDropMove,
    toggleFavorite,
  };
};