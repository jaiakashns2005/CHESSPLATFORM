import React from 'react';
import {
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  ArrowUpDown,
  ArrowUpRight,
  Trash2,
  MessageSquare,
  Eraser,
  MousePointer,
  MoveRight,
  Highlighter,
} from 'lucide-react';
import { AnnotationColor } from '../../types/analysis';

interface AnalysisControlsProps {
  canStepBack: boolean;
  canStepForward: boolean;
  isVariation: boolean;
  activeAnnotationColor: AnnotationColor;
  annotationToolMode: 'interact' | 'arrow' | 'highlight';
  onJumpToStart: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onJumpToEnd: () => void;
  onFlipBoard: () => void;
  onPromoteVariation: () => void;
  onDeleteVariation: () => void;
  onOpenCommentEditor: () => void;
  onSetAnnotationColor: (color: AnnotationColor) => void;
  onSetAnnotationToolMode: (mode: 'interact' | 'arrow' | 'highlight') => void;
  onClearAnnotations: () => void;
}

export const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  canStepBack,
  canStepForward,
  isVariation,
  activeAnnotationColor,
  annotationToolMode,
  onJumpToStart,
  onStepBackward,
  onStepForward,
  onJumpToEnd,
  onFlipBoard,
  onPromoteVariation,
  onDeleteVariation,
  onOpenCommentEditor,
  onSetAnnotationColor,
  onSetAnnotationToolMode,
  onClearAnnotations,
}) => {
  const colors: { key: AnnotationColor; bg: string; label: string }[] = [
    { key: 'green', bg: 'bg-emerald-500', label: 'Green' },
    { key: 'red', bg: 'bg-rose-500', label: 'Red' },
    { key: 'blue', bg: 'bg-blue-500', label: 'Blue' },
    { key: 'yellow', bg: 'bg-amber-400', label: 'Yellow' },
  ];

  return (
    <div className="bg-chess-card border border-chess-border rounded-lg p-3 shadow-lg space-y-3">
      {/* Primary Timeline Navigation */}
      <div className="flex items-center justify-between gap-1 bg-chess-surface p-1 rounded-lg border border-chess-border">
        <button
          onClick={onJumpToStart}
          disabled={!canStepBack}
          title="Start of Line (Home)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>
        <button
          onClick={onStepBackward}
          disabled={!canStepBack}
          title="Previous Move (Left Arrow)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onStepForward}
          disabled={!canStepForward}
          title="Next Move (Right Arrow)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onJumpToEnd}
          disabled={!canStepForward}
          title="End of Line (End)"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-chess-border mx-1" />
        <button
          onClick={onFlipBoard}
          title="Flip Board"
          className="p-2 rounded hover:bg-chess-border/70 text-gray-300 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Variation & Commentary Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onOpenCommentEditor}
          title="Add or Edit Position Note"
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-200 border border-chess-border text-xs font-semibold transition-all active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Comment</span>
        </button>

        <button
          onClick={onPromoteVariation}
          disabled={!isVariation}
          title="Promote Variation to Main Line"
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-200 border border-chess-border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-chess-accent" />
          <span className="truncate">Promote</span>
        </button>

        <button
          onClick={onDeleteVariation}
          disabled={!isVariation}
          title="Delete this Variation Branch"
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-chess-surface hover:bg-rose-950/40 text-gray-200 hover:text-rose-300 border border-chess-border hover:border-rose-800 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span className="truncate">Delete</span>
        </button>
      </div>

      {/* Board Annotations & Drawing Tools */}
      <div className="pt-2 border-t border-chess-border/60 flex items-center justify-between gap-2">
        {/* Tool Mode Buttons (Touch/Mobile & Desktop) */}
        <div className="flex items-center gap-1 bg-chess-surface p-1 rounded-md border border-chess-border">
          <button
            onClick={() => onSetAnnotationToolMode('interact')}
            title="Move Pieces"
            className={`p-1.5 rounded transition-colors ${
              annotationToolMode === 'interact' ? 'bg-chess-accent text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetAnnotationToolMode('arrow')}
            title="Draw Arrow (Right-Click Drag)"
            className={`p-1.5 rounded transition-colors ${
              annotationToolMode === 'arrow' ? 'bg-chess-accent text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MoveRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetAnnotationToolMode('highlight')}
            title="Highlight Square (Right-Click)"
            className={`p-1.5 rounded transition-colors ${
              annotationToolMode === 'highlight' ? 'bg-chess-accent text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c.key}
              onClick={() => onSetAnnotationColor(c.key)}
              title={`${c.label} Marker`}
              className={`w-5 h-5 rounded-full ${c.bg} transition-all ${
                activeAnnotationColor === c.key ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        {/* Clear Annotations */}
        <button
          onClick={onClearAnnotations}
          title="Clear all arrows and square highlights"
          className="p-1.5 rounded bg-chess-surface hover:bg-chess-border text-gray-400 hover:text-gray-200 border border-chess-border transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
