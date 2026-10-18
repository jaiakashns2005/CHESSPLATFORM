import { useState, useCallback, useRef } from 'react';
import { AnnotationColor, BoardArrow, SquareHighlight } from '../types/analysis';
import { ChessSquare } from '../types/chess';

export const useBoardAnnotations = () => {
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [squareHighlights, setSquareHighlights] = useState<SquareHighlight[]>([]);
  const [activeColor, setActiveColor] = useState<AnnotationColor>('green');
  const [toolMode, setToolMode] = useState<'interact' | 'arrow' | 'highlight'>('interact');

  const startSquareRef = useRef<ChessSquare | null>(null);

  const clearAnnotations = useCallback(() => {
    setArrows([]);
    setSquareHighlights([]);
    startSquareRef.current = null;
  }, []);

  const toggleHighlight = useCallback((square: ChessSquare, color: AnnotationColor = activeColor) => {
    setSquareHighlights((prev) => {
      const existingIdx = prev.findIndex((h) => h.square === square);
      if (existingIdx >= 0) {
        if (prev[existingIdx].color === color) {
          // Remove highlight if same color
          return prev.filter((_, idx) => idx !== existingIdx);
        } else {
          // Update color
          const updated = [...prev];
          updated[existingIdx] = { square, color };
          return updated;
        }
      }
      return [...prev, { square, color }];
    });
  }, [activeColor]);

  const toggleArrow = useCallback((from: ChessSquare, to: ChessSquare, color: AnnotationColor = activeColor) => {
    if (from === to) {
      toggleHighlight(from, color);
      return;
    }

    setArrows((prev) => {
      const existingIdx = prev.findIndex((a) => a.from === from && a.to === to);
      if (existingIdx >= 0) {
        if (prev[existingIdx].color === color) {
          return prev.filter((_, idx) => idx !== existingIdx);
        } else {
          const updated = [...prev];
          updated[existingIdx] = { id: `${from}-${to}`, from, to, color };
          return updated;
        }
      }
      return [...prev, { id: `${from}-${to}`, from, to, color }];
    });
  }, [activeColor, toggleHighlight]);

  const handleStartDraw = useCallback((square: ChessSquare) => {
    startSquareRef.current = square;
  }, []);

  const handleEndDraw = useCallback((square: ChessSquare) => {
    if (!startSquareRef.current) return;
    const from = startSquareRef.current;
    startSquareRef.current = null;

    if (from === square) {
      toggleHighlight(square, activeColor);
    } else {
      toggleArrow(from, square, activeColor);
    }
  }, [activeColor, toggleHighlight, toggleArrow]);

  return {
    arrows,
    squareHighlights,
    activeColor,
    toolMode,
    setActiveColor,
    setToolMode,
    clearAnnotations,
    toggleHighlight,
    toggleArrow,
    handleStartDraw,
    handleEndDraw,
  };
};
