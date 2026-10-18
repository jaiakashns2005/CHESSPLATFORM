import { useState, useCallback, useMemo } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { MoveTree } from '../core/moveTree';
import {
  BoardOrientation,
  ChessSquare,
  MaterialBalance,
  MoveHistoryItem,
  PendingPromotion,
  PieceColor,
  PieceType,
} from '../types/chess';
import { calculateMaterialBalance, STARTING_FEN, parsePGN } from '../utils/chessUtils';
import { soundManager } from '../core/sound';

export interface UseAnalysisBoardOptions {
  initialFen?: string;
  initialOrientation?: BoardOrientation;
}

export const useAnalysisBoard = (options: UseAnalysisBoardOptions = {}) => {
  const { initialFen = STARTING_FEN, initialOrientation = 'white' } = options;

  const [moveTree, setMoveTree] = useState<MoveTree>(() => new MoveTree(initialFen));
  const [currentNodeId, setCurrentNodeId] = useState<string>(() => moveTree.rootId);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessSquare[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [orientation, setOrientation] = useState<BoardOrientation>(initialOrientation);
  const [version, setVersion] = useState<number>(0); // Trigger state refreshes on tree mutations

  // Current node
  const currentNode = useMemo(() => {
    return moveTree.getNode(currentNodeId) || moveTree.getNode(moveTree.rootId)!;
  }, [moveTree, currentNodeId, version]);

  // Current active FEN
  const currentFen = useMemo(() => {
    return currentNode.fen;
  }, [currentNode]);

  // Current turn
  const turn: PieceColor = useMemo(() => {
    return (currentFen.split(' ')[1] as PieceColor) || 'w';
  }, [currentFen]);

  // Current active Chess instance for move calculation
  const currentChess = useMemo(() => {
    try {
      return new Chess(currentFen);
    } catch {
      return new Chess();
    }
  }, [currentFen]);

  // Check state
  const isCheck = useMemo(() => {
    return currentChess.inCheck();
  }, [currentChess]);

  // Material balance
  const materialBalance: MaterialBalance = useMemo(() => {
    return calculateMaterialBalance(currentFen);
  }, [currentFen]);

  // Last move
  const lastMove = useMemo(() => {
    if (currentNode.id === moveTree.rootId) return null;
    return { from: currentNode.from, to: currentNode.to };
  }, [currentNode, moveTree.rootId]);

  // Legal moves for a square
  const getLegalMovesForSquare = useCallback(
    (square: ChessSquare): ChessSquare[] => {
      try {
        const moves = currentChess.moves({ square: square as Square, verbose: true }) as Move[];
        return moves.map((m) => m.to as ChessSquare);
      } catch {
        return [];
      }
    },
    [currentChess]
  );

  // Check if move requires promotion modal
  const isPromotionMove = useCallback(
    (from: ChessSquare, to: ChessSquare): boolean => {
      const piece = currentChess.get(from as Square);
      if (!piece || piece.type !== 'p') return false;

      const isWhite = piece.color === 'w';
      const destRank = to[1];

      if ((isWhite && destRank === '8') || (!isWhite && destRank === '1')) {
        const validMoves = currentChess.moves({ square: from as Square, verbose: true }) as Move[];
        return validMoves.some((m) => m.to === to);
      }
      return false;
    },
    [currentChess]
  );

  // Make an analysis move
  const makeMove = useCallback(
    (from: ChessSquare, to: ChessSquare, promotionPiece?: PieceType): boolean => {
      try {
        const moveDetails = currentChess.move({
          from: from as Square,
          to: to as Square,
          promotion: promotionPiece,
        });

        if (!moveDetails) {
          soundManager.playIllegal();
          return false;
        }

        const newFen = currentChess.fen();
        const checkmate = currentChess.isCheckmate();
        const inCheck = currentChess.inCheck();
        const isCastle = moveDetails.san.includes('O-O');
        const isCapture = Boolean(moveDetails.captured);
        const isPromotion = Boolean(moveDetails.promotion);

        // Acoustic cues
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

        const parentMoveNumber = currentNode.moveNumber;
        const nextMoveNumber = currentNode.color === 'w' ? parentMoveNumber : parentMoveNumber + 1;

        const nextNodeId = moveTree.addMove(currentNodeId, {
          san: moveDetails.san,
          from: moveDetails.from as ChessSquare,
          to: moveDetails.to as ChessSquare,
          piece: moveDetails.piece,
          color: moveDetails.color,
          captured: moveDetails.captured,
          promotion: moveDetails.promotion,
          fen: newFen,
          moveNumber: nextMoveNumber === 0 ? 1 : nextMoveNumber,
          isCheck: inCheck,
          isCheckmate: checkmate,
        });

        setCurrentNodeId(nextNodeId);
        setSelectedSquare(null);
        setLegalMoves([]);
        setPendingPromotion(null);
        setVersion((v) => v + 1);

        return true;
      } catch {
        soundManager.playIllegal();
        return false;
      }
    },
    [currentChess, currentNode, currentNodeId, moveTree]
  );

  // Handle Square Click
  const handleSquareClick = useCallback(
    (square: ChessSquare) => {
      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        const clickedPiece = currentChess.get(square as Square);
        if (clickedPiece && clickedPiece.color === currentChess.turn()) {
          setSelectedSquare(square);
          setLegalMoves(getLegalMovesForSquare(square));
          return;
        }

        if (legalMoves.includes(square)) {
          if (isPromotionMove(selectedSquare, square)) {
            setPendingPromotion({
              from: selectedSquare,
              to: square,
              color: currentChess.turn(),
            });
            return;
          }

          makeMove(selectedSquare, square);
          return;
        }

        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const piece = currentChess.get(square as Square);
      if (piece && piece.color === currentChess.turn()) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(square));
      }
    },
    [selectedSquare, currentChess, legalMoves, getLegalMovesForSquare, isPromotionMove, makeMove]
  );

  // Drag & Drop
  const handleDropMove = useCallback(
    (from: ChessSquare, to: ChessSquare): boolean => {
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
          color: currentChess.turn(),
        });
        return true;
      }

      return makeMove(from, to);
    },
    [getLegalMovesForSquare, isPromotionMove, currentChess, makeMove]
  );

  // Confirm Promotion
  const confirmPromotion = useCallback(
    (promotionPiece: PieceType) => {
      if (!pendingPromotion) return;
      makeMove(pendingPromotion.from, pendingPromotion.to, promotionPiece);
    },
    [pendingPromotion, makeMove]
  );

  // Cancel Promotion
  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  // Tree Navigation
  const goToNode = useCallback(
    (nodeId: string) => {
      if (moveTree.getNode(nodeId)) {
        setCurrentNodeId(nodeId);
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [moveTree]
  );

  const goToRoot = useCallback(() => {
    goToNode(moveTree.rootId);
  }, [goToNode, moveTree.rootId]);

  const goToPreviousNode = useCallback(() => {
    if (currentNode.parentId) {
      goToNode(currentNode.parentId);
    }
  }, [currentNode.parentId, goToNode]);

  const goToNextNode = useCallback(() => {
    if (currentNode.childrenIds.length > 0) {
      // Default to the first child (main line or primary variation)
      goToNode(currentNode.childrenIds[0]);
    }
  }, [currentNode.childrenIds, goToNode]);

  const goToLastNode = useCallback(() => {
    let target = currentNode;
    while (target.childrenIds.length > 0) {
      const next = moveTree.getNode(target.childrenIds[0]);
      if (!next) break;
      target = next;
    }
    goToNode(target.id);
  }, [currentNode, moveTree, goToNode]);

  // Tree Operations
  const promoteVariation = useCallback(
    (nodeId: string) => {
      const success = moveTree.promoteToMainline(nodeId);
      if (success) {
        setVersion((v) => v + 1);
      }
    },
    [moveTree]
  );

  const deleteVariation = useCallback(
    (nodeId: string) => {
      const node = moveTree.getNode(nodeId);
      const parentId = node?.parentId || moveTree.rootId;

      const success = moveTree.deleteNode(nodeId);
      if (success) {
        goToNode(parentId);
        setVersion((v) => v + 1);
      }
    },
    [moveTree, goToNode]
  );

  const setComment = useCallback(
    (nodeId: string, comment: string) => {
      moveTree.setComment(nodeId, comment);
      setVersion((v) => v + 1);
    },
    [moveTree]
  );

  // Load from Game History / PGN / FEN
  const loadFromHistory = useCallback(
    (history: MoveHistoryItem[], customFen: string = STARTING_FEN) => {
      const newTree = new MoveTree(customFen);
      newTree.loadFromHistory(history, customFen);
      setMoveTree(newTree);
      // Navigate to the final move
      const mainline = newTree.getMainline();
      const last = mainline[mainline.length - 1];
      setCurrentNodeId(last ? last.id : newTree.rootId);
      setSelectedSquare(null);
      setLegalMoves([]);
      setVersion((v) => v + 1);
    },
    []
  );

  const loadFromPGN = useCallback(
    (pgnString: string): { success: boolean; error?: string } => {
      const parsed = parsePGN(pgnString);
      if (!parsed.success) {
        return { success: false, error: parsed.error };
      }

      loadFromHistory(parsed.history, parsed.initialFen);
      return { success: true };
    },
    [loadFromHistory]
  );

  const loadFromFEN = useCallback((fen: string) => {
    const newTree = new MoveTree(fen);
    setMoveTree(newTree);
    setCurrentNodeId(newTree.rootId);
    setSelectedSquare(null);
    setLegalMoves([]);
    setVersion((v) => v + 1);
  }, []);

  const flipBoard = useCallback(() => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  return {
    moveTree,
    currentNode,
    currentNodeId,
    fen: currentFen,
    turn,
    isCheck,
    isGameOver: currentChess.isGameOver(),
    isCheckmate: currentChess.isCheckmate(),
    isStalemate: currentChess.isStalemate(),
    isDraw: currentChess.isDraw(),
    materialBalance,
    selectedSquare,
    legalMoves,
    lastMove,
    pendingPromotion,
    orientation,
    // Actions
    handleSquareClick,
    handleDropMove,
    confirmPromotion,
    cancelPromotion,
    goToNode,
    goToRoot,
    goToPreviousNode,
    goToNextNode,
    goToLastNode,
    promoteVariation,
    deleteVariation,
    setComment,
    loadFromHistory,
    loadFromPGN,
    loadFromFEN,
    flipBoard,
    setOrientation,
  };
};
