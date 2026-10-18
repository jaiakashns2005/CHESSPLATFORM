import React, { useEffect, useRef } from 'react';
import { MoveHistoryItem } from '../../types/chess';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from 'lucide-react';
import { formatMoveSAN } from '../../utils/chessUtils';

interface MoveHistoryProps {
  history: MoveHistoryItem[];
  viewingIndex: number | null;
  onJumpToMove: (index: number) => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  viewingIndex,
  onJumpToMove,
  onStepBackward,
  onStepForward,
  onJumpToStart,
  onJumpToEnd,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMoveRef = useRef<HTMLButtonElement>(null);

  // Group moves into pairs (White, Black)
  const movePairs: { moveNumber: number; white?: MoveHistoryItem; black?: MoveHistoryItem }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Keyboard navigation for moves (left/right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onStepBackward();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onStepForward();
      } else if (e.key === 'Home') {
        e.preventDefault();
        onJumpToStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        onJumpToEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStepBackward, onStepForward, onJumpToStart, onJumpToEnd]);

  // Auto-scroll to active move
  useEffect(() => {
    if (activeMoveRef.current && scrollRef.current) {
      activeMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [viewingIndex, history.length]);

  const activeIndex = viewingIndex === null ? history.length - 1 : viewingIndex;

  return (
    <div className="bg-chess-card border border-chess-border rounded-lg flex flex-col h-full overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-chess-border flex items-center justify-between bg-chess-surface">
        <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wider">Move History</h3>
        <span className="text-xs text-gray-400 font-mono">
          {history.length} {history.length === 1 ? 'ply' : 'plies'}
        </span>
      </div>

      {/* Move list table */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-sm min-h-[160px]">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500 italic py-8">
            No moves played yet. Make a move on the board!
          </div>
        ) : (
          <div className="space-y-0.5">
            {movePairs.map((pair, rowIdx) => {
              const whiteIndex = rowIdx * 2;
              const blackIndex = rowIdx * 2 + 1;
              const isWhiteActive = activeIndex === whiteIndex;
              const isBlackActive = activeIndex === blackIndex;

              return (
                <div
                  key={pair.moveNumber}
                  className={`grid grid-cols-[38px_1fr_1fr] items-center rounded px-2 py-1 text-xs ${
                    rowIdx % 2 === 0 ? 'bg-chess-surface/40' : 'bg-transparent'
                  }`}
                >
                  <span className="text-gray-500 font-semibold">{pair.moveNumber}.</span>

                  {/* White move */}
                  {pair.white ? (
                    <button
                      ref={isWhiteActive ? activeMoveRef : undefined}
                      onClick={() => onJumpToMove(whiteIndex)}
                      className={`text-left px-2 py-0.5 rounded font-semibold transition-colors ${
                        isWhiteActive
                          ? 'bg-chess-accent text-white font-bold'
                          : 'text-gray-200 hover:bg-chess-border/50'
                      }`}
                    >
                      {formatMoveSAN(pair.white.san)}
                    </button>
                  ) : (
                    <span />
                  )}

                  {/* Black move */}
                  {pair.black ? (
                    <button
                      ref={isBlackActive ? activeMoveRef : undefined}
                      onClick={() => onJumpToMove(blackIndex)}
                      className={`text-left px-2 py-0.5 rounded font-semibold transition-colors ${
                        isBlackActive
                          ? 'bg-chess-accent text-white font-bold'
                          : 'text-gray-200 hover:bg-chess-border/50'
                      }`}
                    >
                      {formatMoveSAN(pair.black.san)}
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div className="p-2 border-t border-chess-border bg-chess-surface flex items-center justify-center gap-1">
        <button
          onClick={onJumpToStart}
          disabled={history.length === 0 || activeIndex === -1}
          title="Jump to Start (Home)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>
        <button
          onClick={onStepBackward}
          disabled={history.length === 0 || activeIndex === -1}
          title="Step Backward (Left Arrow)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onStepForward}
          disabled={history.length === 0 || viewingIndex === null}
          title="Step Forward (Right Arrow)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onJumpToEnd}
          disabled={history.length === 0 || viewingIndex === null}
          title="Jump to Current (End)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
