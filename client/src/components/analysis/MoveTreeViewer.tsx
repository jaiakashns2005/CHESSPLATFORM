import React, { useRef, useEffect } from 'react';
import { MoveTree } from '../../core/moveTree';
import { formatMoveSAN } from '../../utils/chessUtils';
import { ArrowUpRight, MessageSquare, Trash2, GitBranch } from 'lucide-react';

interface MoveTreeViewerProps {
  moveTree: MoveTree;
  currentNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onPromoteVariation: (nodeId: string) => void;
  onDeleteVariation: (nodeId: string) => void;
  onOpenCommentEditor: (nodeId: string) => void;
}

export const MoveTreeViewer: React.FC<MoveTreeViewerProps> = ({
  moveTree,
  currentNodeId,
  onSelectNode,
  onPromoteVariation,
  onDeleteVariation,
  onOpenCommentEditor,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active move into view
  useEffect(() => {
    if (activeNodeRef.current && scrollRef.current) {
      activeNodeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentNodeId]);

  const root = moveTree.getNode(moveTree.rootId);
  if (!root || root.childrenIds.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 text-xs italic bg-chess-card border border-chess-border rounded-lg">
        <GitBranch className="w-8 h-8 text-gray-600 mb-2" />
        <span>No moves in analysis. Play moves on the board to build main lines and variations!</span>
      </div>
    );
  }

  // Recursive renderer for move nodes & branches
  const renderSubtree = (nodeId: string, isBranchRoot: boolean = false): React.ReactNode => {
    const node = moveTree.getNode(nodeId);
    if (!node) return null;

    const isActive = node.id === currentNodeId;
    const isMain = node.isMainline;
    const isWhite = node.color === 'w';

    return (
      <div key={node.id} className="inline">
        {/* Move Token */}
        <span className="inline-flex items-center gap-0.5 mx-0.5 my-0.5 group relative">
          {(isWhite || isBranchRoot) && (
            <span className="text-[11px] font-semibold text-gray-500 font-mono select-none">
              {node.moveNumber}{isWhite ? '.' : '...'}
            </span>
          )}

          <button
            ref={isActive ? activeNodeRef : undefined}
            onClick={() => onSelectNode(node.id)}
            className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold transition-all ${
              isActive
                ? 'bg-chess-accent text-white shadow-sm'
                : isMain
                ? 'text-gray-100 hover:bg-chess-surface border border-transparent hover:border-chess-border'
                : 'text-gray-400 hover:bg-chess-surface border border-transparent hover:border-chess-border'
            }`}
          >
            {formatMoveSAN(node.san)}
          </button>

          {/* Comment Icon Indicator */}
          {node.comment && (
            <button
              onClick={() => onOpenCommentEditor(node.id)}
              title={node.comment}
              className="text-amber-400 hover:text-amber-300 ml-0.5"
            >
              <MessageSquare className="w-3 h-3 fill-amber-400/30" />
            </button>
          )}

          {/* Quick Variation Actions Dropdown / Hover actions */}
          {!isMain && (
            <div className="hidden group-hover:flex items-center gap-1 bg-chess-card border border-chess-border px-1 py-0.5 rounded shadow-lg absolute -top-7 left-0 z-30 animate-fade-in">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteVariation(node.id);
                }}
                title="Promote to Main Line"
                className="p-1 text-gray-300 hover:text-chess-accent hover:bg-chess-surface rounded"
              >
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCommentEditor(node.id);
                }}
                title="Add / Edit Comment"
                className="p-1 text-gray-300 hover:text-amber-400 hover:bg-chess-surface rounded"
              >
                <MessageSquare className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVariation(node.id);
                }}
                title="Delete Variation"
                className="p-1 text-gray-300 hover:text-rose-400 hover:bg-chess-surface rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </span>

        {/* Inline Comment Text */}
        {node.comment && (
          <span className="text-[11px] text-amber-300/85 font-sans italic mx-1">
            "{node.comment}"
          </span>
        )}

        {/* First child continuation */}
        {node.childrenIds.length > 0 && renderSubtree(node.childrenIds[0], false)}

        {/* Side Variations */}
        {node.childrenIds.length > 1 && (
          <div className="block my-1.5 pl-3 py-1 border-l-2 border-chess-accent/40 bg-chess-surface/40 rounded-r text-gray-400 text-xs">
            {node.childrenIds.slice(1).map((childId) => (
              <div key={childId} className="my-0.5">
                <span className="text-gray-500 font-mono select-none mr-1">(</span>
                {renderSubtree(childId, true)}
                <span className="text-gray-500 font-mono select-none ml-1">)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-chess-card border border-chess-border rounded-lg flex flex-col h-full overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-chess-border flex items-center justify-between bg-chess-surface">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-chess-accent" />
          <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider">Analysis Move Tree</h3>
        </div>
        <span className="text-[11px] text-gray-400 font-mono">
          {moveTree.nodes.size - 1} positions
        </span>
      </div>

      {/* Tree Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed font-mono">
        {root.childrenIds.map((childId) => renderSubtree(childId, false))}
      </div>
    </div>
  );
};
