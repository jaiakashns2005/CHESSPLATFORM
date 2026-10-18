import { useState, useCallback, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import {
  ChessSquare,
  PieceColor,
  PieceType,
  MoveHistoryItem,
  GameResult,
  PendingPromotion,
  BoardOrientation,
  MaterialBalance,
  TimeControl,
  DrawOfferState,
  PGNMetadata,
} from '../types/chess';
import {
  calculateMaterialBalance,
  STARTING_FEN,
  hasInsufficientMaterialToMate,
  buildPGN,
  parsePGN,
} from '../utils/chessUtils';
import { DEFAULT_TIME_CONTROL } from '../utils/timeUtils';
import { soundManager } from '../core/sound';
import { useChessClock } from './useChessClock';

export interface UseChessGameOptions {
  initialFen?: string;
  initialOrientation?: BoardOrientation;
  initialTimeControl?: TimeControl;
  soundEnabled?: boolean;
  whitePlayerName?: string;
  blackPlayerName?: string;
}

export const useChessGame = (options: UseChessGameOptions = {}) => {
  const {
    initialFen = STARTING_FEN,
    initialOrientation = 'white',
    initialTimeControl = DEFAULT_TIME_CONTROL,
    soundEnabled = true,
    whitePlayerName = 'White Player',
    blackPlayerName = 'Black Player',
  } = options;

  // Internal chess instance
  const [chess] = useState<Chess>(() => new Chess(initialFen));

  // Dynamic UI States
  const [fen, setFen] = useState<string>(() => chess.fen());
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [orientation, setOrientation] = useState<BoardOrientation>(initialOrientation);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [timeControl, setTimeControl] = useState<TimeControl>(initialTimeControl);
  const [drawOffer, setDrawOffer] = useState<DrawOfferState>({ isOffered: false, offeredBy: null });
  const [result, setResult] = useState<GameResult>({
    winner: null,
    reason: null,
    message: '',
  });

  // Sound preference sync
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Evaluate game result from chess rules
  const evaluateGameResult = useCallback((game: Chess): GameResult => {
    if (game.isCheckmate()) {
      const winner: PieceColor = game.turn() === 'w' ? 'b' : 'w';
      return {
        winner,
        reason: 'checkmate',
        message: `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins.`,
      };
    }
    if (game.isStalemate()) {
      return {
        winner: 'draw',
        reason: 'stalemate',
        message: 'Draw by Stalemate. No legal moves available.',
      };
    }
    if (game.isThreefoldRepetition()) {
      return {
        winner: 'draw',
        reason: 'threefold_repetition',
        message: 'Draw by Threefold Repetition.',
      };
    }
    if (game.isInsufficientMaterial()) {
      return {
        winner: 'draw',
        reason: 'insufficient_material',
        message: 'Draw by Insufficient Material.',
      };
    }
    if (game.isDraw()) {
      return {
        winner: 'draw',
        reason: 'fifty_move_rule',
        message: 'Draw by 50-Move Rule.',
      };
    }
    return {
      winner: null,
      reason: null,
      message: '',
    };
  }, []);

  // Handle Clock Timeout according to FIDE rules
  const handleTimeout = useCallback(
    (timedOutColor: PieceColor) => {
      const opponentColor: PieceColor = timedOutColor === 'w' ? 'b' : 'w';
      const opponentInsufficient = hasInsufficientMaterialToMate(chess.fen(), opponentColor);

      if (opponentInsufficient) {
        setResult({
          winner: 'draw',
          reason: 'timeout_insufficient_material',
          message: `Draw by Timeout vs Insufficient Material (${timedOutColor === 'w' ? 'White' : 'Black'} flagged, but ${opponentColor === 'w' ? 'White' : 'Black'} cannot mate).`,
        });
      } else {
        setResult({
          winner: opponentColor,
          reason: 'timeout',
          message: `${timedOutColor === 'w' ? 'White' : 'Black'} ran out of time! ${opponentColor === 'w' ? 'White' : 'Black'} wins on time.`,
        });
      }
      soundManager.playGameOver();
    },
    [chess]
  );

  // Initialize Clock
  const {
    whiteTimeMs,
    blackTimeMs,
    isRunning: isClockRunning,
    activeColor: clockActiveColor,
    clockState,
    startClock,
    pauseClock,
    switchTurn: switchClockTurn,
    resetClock,
  } = useChessClock({
    timeControl,
    onTimeout: handleTimeout,
    soundEnabled,
  });

  // Pause clock when game is over or when viewing history
  useEffect(() => {
    if (result.winner !== null || viewingIndex !== null) {
      pauseClock();
    }
  }, [result.winner, viewingIndex, pauseClock]);

  // Compute viewing FEN when browsing history
  const activeFen = useMemo(() => {
    if (viewingIndex === null) {
      return fen;
    }
    if (viewingIndex === -1) {
      return initialFen;
    }
    if (history[viewingIndex]) {
      return history[viewingIndex].fen;
    }
    return fen;
  }, [viewingIndex, fen, history, initialFen]);

  // Compute Material Balance
  const materialBalance: MaterialBalance = useMemo(() => {
    return calculateMaterialBalance(activeFen);
  }, [activeFen]);

  // Turn of the active board
  const activeTurn: PieceColor = useMemo(() => {
    return (activeFen.split(' ')[1] as PieceColor) || 'w';
  }, [activeFen]);

  // Check state
  const isCheck = useMemo(() => {
    try {
      const temp = new Chess(activeFen);
      return temp.inCheck();
    } catch {
      return false;
    }
  }, [activeFen]);

  // Re-compute legal moves when square is selected
  const getLegalMovesForSquare = useCallback(
    (square: ChessSquare): ChessSquare[] => {
      // Cannot move when viewing history or if game is over
      if (viewingIndex !== null || result.winner !== null) return [];

      try {
        const moves = chess.moves({ square: square as Square, verbose: true }) as Move[];
        return moves.map((m) => m.to as ChessSquare);
      } catch {
        return [];
      }
    },
    [chess, viewingIndex, result.winner]
  );

  // Execute a verified move
  const executeMove = useCallback(
    (from: ChessSquare, to: ChessSquare, promotionPiece?: PieceType): boolean => {
      if (viewingIndex !== null || result.winner !== null) {
        return false;
      }

      try {
        const moveDetails = chess.move({
          from: from as Square,
          to: to as Square,
          promotion: promotionPiece,
        });

        if (!moveDetails) {
          soundManager.playIllegal();
          return false;
        }

        const newFen = chess.fen();
        const checkmate = chess.isCheckmate();
        const inCheck = chess.inCheck();
        const isCastle = moveDetails.san.includes('O-O');
        const isCapture = Boolean(moveDetails.captured);
        const isPromotion = Boolean(moveDetails.promotion);

        // Switch or start clock
        if (history.length === 0) {
          // White's first move starts Black's clock
          startClock('b');
        } else {
          switchClockTurn(chess.turn());
        }

        // Play appropriate acoustic cues
        if (checkmate) {
          soundManager.playGameOver();
        } else if (inCheck) {
          soundManager.playCheck();
        } else if (isPromotion) {
          soundManager.playPromotion();
        } else if (isCastle) {
          soundManager.playCastle();
        } else if (isCapture) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }

        const historyItem: MoveHistoryItem = {
          id: `${moveDetails.san}-${Date.now()}-${history.length}`,
          san: moveDetails.san,
          from: moveDetails.from as ChessSquare,
          to: moveDetails.to as ChessSquare,
          piece: moveDetails.piece,
          color: moveDetails.color,
          captured: moveDetails.captured,
          promotion: moveDetails.promotion,
          fen: newFen,
          moveNumber: Math.floor(history.length / 2) + 1,
          isCheck: inCheck,
          isCheckmate: checkmate,
          timestamp: Date.now(),
          whiteTimeRemainingMs: whiteTimeMs,
          blackTimeRemainingMs: blackTimeMs,
        };

        setFen(newFen);
        setHistory((prev) => [...prev, historyItem]);
        setLastMove({ from, to });
        setSelectedSquare(null);
        setLegalMoves([]);
        setPendingPromotion(null);
        setDrawOffer({ isOffered: false, offeredBy: null });

        const newResult = evaluateGameResult(chess);
        setResult(newResult);

        return true;
      } catch {
        soundManager.playIllegal();
        return false;
      }
    },
    [
      chess,
      viewingIndex,
      result.winner,
      history.length,
      startClock,
      switchClockTurn,
      whiteTimeMs,
      blackTimeMs,
      evaluateGameResult,
    ]
  );

  // Check if a move requires pawn promotion modal
  const isPromotionMove = useCallback(
    (from: ChessSquare, to: ChessSquare): boolean => {
      const piece = chess.get(from as Square);
      if (!piece || piece.type !== 'p') return false;

      const isWhite = piece.color === 'w';
      const destRank = to[1];

      if ((isWhite && destRank === '8') || (!isWhite && destRank === '1')) {
        const validMoves = chess.moves({ square: from as Square, verbose: true }) as Move[];
        return validMoves.some((m) => m.to === to);
      }
      return false;
    },
    [chess]
  );

  // Handle Square Selection / Move Attempt
  const handleSquareClick = useCallback(
    (square: ChessSquare) => {
      if (viewingIndex !== null || result.winner !== null) return;

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        const clickedPiece = chess.get(square as Square);
        if (clickedPiece && clickedPiece.color === chess.turn()) {
          setSelectedSquare(square);
          setLegalMoves(getLegalMovesForSquare(square));
          return;
        }

        if (legalMoves.includes(square)) {
          if (isPromotionMove(selectedSquare, square)) {
            setPendingPromotion({
              from: selectedSquare,
              to: square,
              color: chess.turn(),
            });
            return;
          }

          executeMove(selectedSquare, square);
          return;
        }

        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const piece = chess.get(square as Square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(square));
      }
    },
    [
      viewingIndex,
      result.winner,
      selectedSquare,
      chess,
      legalMoves,
      getLegalMovesForSquare,
      isPromotionMove,
      executeMove,
    ]
  );

  // Drag & Drop move attempt
  const handleDropMove = useCallback(
    (from: ChessSquare, to: ChessSquare): boolean => {
      if (viewingIndex !== null || result.winner !== null) return false;
      if (from === to) return false;

      const validDestinations = getLegalMovesForSquare(from);
      if (!validDestinations.includes(to)) {
        soundManager.playIllegal();
        return false;
      }

      if (isPromotionMove(from, to)) {
        setPendingPromotion({
          from,
          to,
          color: chess.turn(),
        });
        return true;
      }

      return executeMove(from, to);
    },
    [viewingIndex, result.winner, getLegalMovesForSquare, isPromotionMove, executeMove]
  );

  // Confirm pawn promotion selection
  const confirmPromotion = useCallback(
    (promotionPiece: PieceType) => {
      if (!pendingPromotion) return;
      executeMove(pendingPromotion.from, pendingPromotion.to, promotionPiece);
    },
    [pendingPromotion, executeMove]
  );

  // Cancel promotion modal
  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  // History timeline navigation
  const jumpToMove = useCallback(
    (index: number) => {
      if (index >= -1 && index < history.length) {
        setViewingIndex(index === history.length - 1 ? null : index);
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [history.length]
  );

  const stepBackward = useCallback(() => {
    if (history.length === 0) return;
    const currentIndex = viewingIndex === null ? history.length - 1 : viewingIndex;
    if (currentIndex > -1) {
      jumpToMove(currentIndex - 1);
    }
  }, [history.length, viewingIndex, jumpToMove]);

  const stepForward = useCallback(() => {
    if (history.length === 0 || viewingIndex === null) return;
    jumpToMove(viewingIndex + 1);
  }, [history.length, viewingIndex, jumpToMove]);

  const jumpToStart = useCallback(() => {
    if (history.length > 0) {
      jumpToMove(-1);
    }
  }, [history.length, jumpToMove]);

  const jumpToEnd = useCallback(() => {
    setViewingIndex(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  // Undo move
  const undoMove = useCallback(() => {
    if (history.length === 0 || viewingIndex !== null) return;

    chess.undo();
    const newFen = chess.fen();
    const newHistory = history.slice(0, -1);
    const lastHistoryItem = newHistory[newHistory.length - 1];

    setFen(newFen);
    setHistory(newHistory);
    setLastMove(lastHistoryItem ? { from: lastHistoryItem.from, to: lastHistoryItem.to } : null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setDrawOffer({ isOffered: false, offeredBy: null });
    setResult({ winner: null, reason: null, message: '' });
    soundManager.playMove();
  }, [history, viewingIndex, chess]);

  // Restart / Reset Game with new or same TimeControl / FEN
  const resetGame = useCallback(
    (customFen: string = STARTING_FEN, newTimeControl?: TimeControl) => {
      try {
        chess.load(customFen);
        setFen(chess.fen());
        setHistory([]);
        setSelectedSquare(null);
        setLegalMoves([]);
        setLastMove(null);
        setPendingPromotion(null);
        setViewingIndex(null);
        setDrawOffer({ isOffered: false, offeredBy: null });
        setResult({ winner: null, reason: null, message: '' });

        if (newTimeControl) {
          setTimeControl(newTimeControl);
          resetClock(newTimeControl);
        } else {
          resetClock(timeControl);
        }
        soundManager.playMove();
      } catch (err) {
        console.error('Failed to reset chess board:', err);
      }
    },
    [chess, timeControl, resetClock]
  );

  // Rematch (resets game with same settings)
  const rematch = useCallback(() => {
    resetGame(STARTING_FEN, timeControl);
  }, [resetGame, timeControl]);

  // Change Time Control
  const changeTimeControl = useCallback(
    (newTimeControl: TimeControl) => {
      setTimeControl(newTimeControl);
      resetClock(newTimeControl);
    },
    [resetClock]
  );

  // Flip board view
  const flipBoard = useCallback(() => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  // Resign
  const resign = useCallback(
    (color: PieceColor) => {
      if (result.winner !== null) return;
      const winner: PieceColor = color === 'w' ? 'b' : 'w';
      setResult({
        winner,
        reason: 'resignation',
        message: `${color === 'w' ? 'White' : 'Black'} resigned. ${winner === 'w' ? 'White' : 'Black'} wins!`,
      });
      pauseClock();
      soundManager.playGameOver();
    },
    [result.winner, pauseClock]
  );

  // Offer Draw
  const offerDraw = useCallback(
    (byColor: PieceColor) => {
      if (result.winner !== null) return;
      setDrawOffer({ isOffered: true, offeredBy: byColor });
    },
    [result.winner]
  );

  // Accept Draw
  const acceptDraw = useCallback(() => {
    if (result.winner !== null) return;
    setDrawOffer({ isOffered: false, offeredBy: null });
    setResult({
      winner: 'draw',
      reason: 'agreement',
      message: 'Game drawn by mutual agreement.',
    });
    pauseClock();
    soundManager.playGameOver();
  }, [result.winner, pauseClock]);

  // Decline Draw
  const declineDraw = useCallback(() => {
    setDrawOffer({ isOffered: false, offeredBy: null });
  }, []);

  // Export PGN with complete headers
  const exportPGN = useCallback((): string => {
    let resultHeader = '*';
    if (result.winner === 'w') resultHeader = '1-0';
    else if (result.winner === 'b') resultHeader = '0-1';
    else if (result.winner === 'draw') resultHeader = '1/2-1/2';

    const metadata: PGNMetadata = {
      event: 'Local Match',
      site: 'Chess Training Platform',
      white: whitePlayerName,
      black: blackPlayerName,
      result: resultHeader,
      timeControl: timeControl.isUnlimited
        ? 'Unlimited'
        : `${timeControl.initialMinutes * 60}+${timeControl.incrementSeconds}`,
    };

    return buildPGN(history, metadata, initialFen);
  }, [result.winner, whitePlayerName, blackPlayerName, timeControl, history, initialFen]);

  // Load and Replay PGN
  const loadPGN = useCallback(
    (pgnString: string): { success: boolean; error?: string } => {
      const parsed = parsePGN(pgnString);
      if (!parsed.success) {
        return { success: false, error: parsed.error };
      }

      try {
        chess.load(parsed.finalFen);
        setFen(parsed.finalFen);
        setHistory(parsed.history);
        setSelectedSquare(null);
        setLegalMoves([]);
        setLastMove(
          parsed.history.length > 0
            ? {
                from: parsed.history[parsed.history.length - 1].from,
                to: parsed.history[parsed.history.length - 1].to,
              }
            : null
        );
        setPendingPromotion(null);
        setViewingIndex(null);

        // Determine result if present in PGN
        let pgnResult: GameResult = { winner: null, reason: null, message: '' };
        if (parsed.metadata.result === '1-0') {
          pgnResult = { winner: 'w', reason: 'agreement', message: 'White won according to PGN.' };
        } else if (parsed.metadata.result === '0-1') {
          pgnResult = { winner: 'b', reason: 'agreement', message: 'Black won according to PGN.' };
        } else if (parsed.metadata.result === '1/2-1/2') {
          pgnResult = { winner: 'draw', reason: 'agreement', message: 'Game drawn according to PGN.' };
        } else {
          pgnResult = evaluateGameResult(chess);
        }
        setResult(pgnResult);

        // Pause clock for replayed PGN
        pauseClock();
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error applying PGN to board.';
        return { success: false, error: msg };
      }
    },
    [chess, evaluateGameResult, pauseClock]
  );

  return {
    chess,
    fen: activeFen,
    actualFen: fen,
    turn: activeTurn,
    isCheck,
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver() || result.winner !== null,
    result,
    history,
    selectedSquare,
    legalMoves,
    lastMove,
    pendingPromotion,
    orientation,
    viewingIndex,
    materialBalance,
    timeControl,
    clockState,
    whiteTimeMs,
    blackTimeMs,
    isClockRunning,
    clockActiveColor,
    drawOffer,
    // Actions
    handleSquareClick,
    handleDropMove,
    confirmPromotion,
    cancelPromotion,
    jumpToMove,
    stepBackward,
    stepForward,
    jumpToStart,
    jumpToEnd,
    undoMove,
    resetGame,
    rematch,
    changeTimeControl,
    flipBoard,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    exportPGN,
    loadPGN,
    setOrientation,
  };
};
