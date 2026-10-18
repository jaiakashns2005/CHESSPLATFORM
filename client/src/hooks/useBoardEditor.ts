import { useState, useCallback, useMemo } from 'react';
import { PositionEditorState } from '../types/analysis';
import { ChessSquare, PieceColor, PieceType } from '../types/chess';
import {
  generateFENFromEditorState,
  parseFENToEditorState,
  validatePositionEditorState,
  PositionValidationResult,
} from '../core/positionValidator';
import { STARTING_FEN } from '../utils/chessUtils';
import { soundManager } from '../core/sound';

export const useBoardEditor = (initialFen: string = STARTING_FEN) => {
  const [state, setState] = useState<PositionEditorState>(() => parseFENToEditorState(initialFen));

  // Compute live validation result
  const validation: PositionValidationResult = useMemo(() => {
    return validatePositionEditorState(state);
  }, [state]);

  // Current generated FEN
  const currentFen = useMemo(() => {
    return generateFENFromEditorState(state);
  }, [state]);

  // Place piece on square or remove if selected tool is trash
  const handleSquareClick = useCallback(
    (square: ChessSquare) => {
      const tool = state.selectedPalettePiece;

      if (tool === 'trash') {
        setState((prev) => {
          const nextPieces = { ...prev.pieces };
          delete nextPieces[square];
          return { ...prev, pieces: nextPieces };
        });
        soundManager.playMove();
        return;
      }

      if (tool) {
        setState((prev) => ({
          ...prev,
          pieces: {
            ...prev.pieces,
            [square]: { type: tool.type, color: tool.color },
          },
        }));
        soundManager.playMove();
        return;
      }

      // If no tool selected, remove piece from square on click
      if (state.pieces[square]) {
        setState((prev) => {
          const nextPieces = { ...prev.pieces };
          delete nextPieces[square];
          return { ...prev, pieces: nextPieces };
        });
        soundManager.playMove();
      }
    },
    [state.selectedPalettePiece, state.pieces]
  );

  // Drag & drop piece from square to square
  const handleDropPiece = useCallback(
    (fromSquare: ChessSquare, toSquare: ChessSquare) => {
      if (fromSquare === toSquare) return;

      setState((prev) => {
        const piece = prev.pieces[fromSquare];
        if (!piece) return prev;

        const nextPieces = { ...prev.pieces };
        delete nextPieces[fromSquare];
        nextPieces[toSquare] = piece;

        return { ...prev, pieces: nextPieces };
      });
      soundManager.playMove();
    },
    []
  );

  // Palette piece selection
  const selectPalettePiece = useCallback(
    (piece: { type: PieceType; color: PieceColor } | 'trash' | null) => {
      setState((prev) => ({ ...prev, selectedPalettePiece: piece }));
    },
    []
  );

  // Clear all pieces
  const clearBoard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pieces: {},
      castling: {
        whiteKingside: false,
        whiteQueenside: false,
        blackKingside: false,
        blackQueenside: false,
      },
      enPassantSquare: '-',
      halfmoveClock: 0,
      fullmoveNumber: 1,
    }));
    soundManager.playMove();
  }, []);

  // Reset to standard starting position
  const resetToStartingPosition = useCallback(() => {
    setState(parseFENToEditorState(STARTING_FEN));
    soundManager.playMove();
  }, []);

  // Turn switcher
  const setTurn = useCallback((turn: PieceColor) => {
    setState((prev) => ({ ...prev, turn }));
  }, []);

  // Castling toggles
  const toggleCastling = useCallback(
    (right: 'whiteKingside' | 'whiteQueenside' | 'blackKingside' | 'blackQueenside') => {
      setState((prev) => ({
        ...prev,
        castling: {
          ...prev.castling,
          [right]: !prev.castling[right],
        },
      }));
    },
    []
  );

  // En passant square
  const setEnPassantSquare = useCallback((enPassantSquare: ChessSquare | '-') => {
    setState((prev) => ({ ...prev, enPassantSquare }));
  }, []);

  // Load external FEN into editor
  const loadFEN = useCallback((fen: string) => {
    try {
      setState(parseFENToEditorState(fen));
      soundManager.playMove();
    } catch (err) {
      console.error('Failed to parse FEN into editor state:', err);
    }
  }, []);

  return {
    state,
    validation,
    currentFen,
    handleSquareClick,
    handleDropPiece,
    selectPalettePiece,
    clearBoard,
    resetToStartingPosition,
    setTurn,
    toggleCastling,
    setEnPassantSquare,
    loadFEN,
  };
};
