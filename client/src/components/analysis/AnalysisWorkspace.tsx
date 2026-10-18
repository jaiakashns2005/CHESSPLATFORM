import React, { useState, useEffect, useMemo } from 'react';
import { useAnalysisBoard } from '../../hooks/useAnalysisBoard';
import { useBoardAnnotations } from '../../hooks/useBoardAnnotations';
import { useStockfish } from '../../hooks/useStockfish';
import { useGameAnalysis } from '../../hooks/useGameAnalysis';
import { ChessBoard } from '../board/ChessBoard';
import { MoveTreeViewer } from './MoveTreeViewer';
import { AnalysisControls } from './AnalysisControls';
import { PositionInfoPanel } from './PositionInfoPanel';
import { CommentEditor } from './CommentEditor';
import { EvaluationBar } from '../engine/EvaluationBar';
import { EnginePanel } from '../engine/EnginePanel';
import { GameAnalysisPanel } from './GameAnalysisPanel';
import { FENModal } from '../game/FENModal';
import { BoardTheme, ChessSquare, MoveHistoryItem, PieceType } from '../../types/chess';
import { BoardArrow } from '../../types/analysis';

interface AnalysisWorkspaceProps {
  currentTheme: BoardTheme;
  initialHistory?: MoveHistoryItem[];
  initialFen?: string;
  onOpenPlayFromPosition?: (fen: string) => void;
}

export const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({
  currentTheme,
  initialHistory,
  initialFen,
}) => {
  const {
    moveTree,
    currentNode,
    currentNodeId,
    fen,
    turn,
    isCheck,
    isGameOver,
    materialBalance,
    selectedSquare,
    legalMoves,
    lastMove,
    pendingPromotion,
    orientation,
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
  } = useAnalysisBoard({
    initialFen,
  });

  const {
    arrows,
    squareHighlights,
    activeColor,
    toolMode,
    setActiveColor,
    setToolMode,
    clearAnnotations,
    handleStartDraw,
    handleEndDraw,
  } = useBoardAnnotations();

  // Initialize Stockfish engine analysis for the current active FEN
  const {
    status: engineStatus,
    isAnalyzing: isEngineAnalyzing,
    error: engineError,
    lines: engineLines,
    topEvaluation,
    currentDepth: engineDepth,
    bestMoveSan,
    bestMoveUci,
    bestMoveFrom,
    bestMoveTo,
    settings: engineSettings,
    toggleEngine,
    setDepth: setEngineDepth,
    setMultiPv: setEngineMultiPv,
    restartEngine,
  } = useStockfish(fen, {
    initialDepth: 15,
    initialMultiPv: 2,
    autoStart: true,
  });

  const gameMainline = useMemo(() => moveTree.getMainline(), [moveTree]);
  const {
    status: gameAnalysisStatus,
    error: gameAnalysisError,
    moves: gameAnalysisMoves,
    points: gameEvaluationPoints,
    progress: gameAnalysisProgress,
    analyzeGame,
    cancelAnalysis,
  } = useGameAnalysis();

  const [isFENModalOpen, setIsFENModalOpen] = useState(false);
  const [commentEditingNodeId, setCommentEditingNodeId] = useState<string | null>(null);

  // Load initial history if passed from game
  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      loadFromHistory(initialHistory, initialFen);
    }
  }, [initialHistory, initialFen, loadFromHistory]);

  // Keyboard navigation for analysis moves (Arrow Left/Right, Home, End)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousNode();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextNode();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToRoot();
      } else if (e.key === 'End') {
        e.preventDefault();
        goToLastNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousNode, goToNextNode, goToRoot, goToLastNode]);

  // Combine user-drawn arrows with the engine's best-move arrow
  const combinedArrows = useMemo(() => {
    const result: BoardArrow[] = [...arrows];
    if (engineSettings.enabled && bestMoveFrom && bestMoveTo) {
      result.push({
        id: 'engine-best-move',
        from: bestMoveFrom,
        to: bestMoveTo,
        color: 'cyan',
      });
    }
    return result;
  }, [arrows, engineSettings.enabled, bestMoveFrom, bestMoveTo]);

  // Handle playing an engine recommended move
  const handlePlayEngineMove = (uciMove: string) => {
    if (uciMove.length < 4) return;
    const from = uciMove.slice(0, 2) as ChessSquare;
    const to = uciMove.slice(2, 4) as ChessSquare;
    const promotion = uciMove.length > 4 ? (uciMove[4] as PieceType) : undefined;

    if (promotion) {
      confirmPromotion(promotion);
    } else {
      handleDropMove(from, to);
    }
  };

  // Handle board square click in touch annotation mode
  const handleCustomSquareClick = (square: ChessSquare) => {
    if (toolMode === 'highlight') {
      handleEndDraw(square);
      return;
    }
    handleSquareClick(square);
  };

  const editingNode = commentEditingNodeId ? moveTree.getNode(commentEditingNodeId) : null;
  const isVariation = Boolean(currentNode.parentId && !currentNode.isMainline);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start animate-fade-in">
      {/* Left Column: Evaluation Bar + Interactive ChessBoard + Analysis Controls */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center justify-center gap-2.5 w-full max-w-[672px]">
          {/* Vertical Stockfish Evaluation Bar */}
          <EvaluationBar
            evaluation={topEvaluation}
            orientation={orientation}
            isEngineActive={engineSettings.enabled}
          />

          {/* Interactive Chess Board */}
          <ChessBoard
            fen={fen}
            turn={turn}
            orientation={orientation}
            theme={currentTheme}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            pendingPromotion={pendingPromotion}
            isCheck={isCheck}
            isGameOver={isGameOver}
            arrows={combinedArrows}
            squareHighlights={squareHighlights}
            onSquareClick={handleCustomSquareClick}
            onDropMove={handleDropMove}
            onConfirmPromotion={confirmPromotion}
            onCancelPromotion={cancelPromotion}
            onRightMouseDown={handleStartDraw}
            onRightMouseUp={handleEndDraw}
          />
        </div>

        {/* Analysis Board Controls */}
        <div className="w-full max-w-[672px]">
          <AnalysisControls
            canStepBack={Boolean(currentNode.parentId)}
            canStepForward={currentNode.childrenIds.length > 0}
            isVariation={isVariation}
            activeAnnotationColor={activeColor}
            annotationToolMode={toolMode}
            onJumpToStart={goToRoot}
            onStepBackward={goToPreviousNode}
            onStepForward={goToNextNode}
            onJumpToEnd={goToLastNode}
            onFlipBoard={flipBoard}
            onPromoteVariation={() => promoteVariation(currentNodeId)}
            onDeleteVariation={() => deleteVariation(currentNodeId)}
            onOpenCommentEditor={() => setCommentEditingNodeId(currentNodeId)}
            onSetAnnotationColor={setActiveColor}
            onSetAnnotationToolMode={setToolMode}
            onClearAnnotations={clearAnnotations}
          />
        </div>
      </div>

      {/* Right Column: Engine Panel, Move Tree Viewer & Position Diagnostics */}
      <div className="flex flex-col gap-4 w-full">
        {/* Real Stockfish Engine Panel */}
        <EnginePanel
          status={engineStatus}
          isAnalyzing={isEngineAnalyzing}
          error={engineError}
          lines={engineLines}
          topEvaluation={topEvaluation}
          currentDepth={engineDepth}
          bestMoveSan={bestMoveSan}
          bestMoveUci={bestMoveUci}
          settings={engineSettings}
          onToggleEngine={toggleEngine}
          onSetDepth={setEngineDepth}
          onSetMultiPv={setEngineMultiPv}
          onPlayMove={handlePlayEngineMove}
          onRestartEngine={restartEngine}
        />

        <GameAnalysisPanel
          status={gameAnalysisStatus}
          error={gameAnalysisError}
          moves={gameAnalysisMoves}
          points={gameEvaluationPoints}
          progress={gameAnalysisProgress}
          canAnalyze={gameMainline.length > 0}
          onAnalyze={(depth) => analyzeGame(moveTree.initialFen, gameMainline, depth)}
          onCancel={cancelAnalysis}
          onSelectMove={(move) => goToNode(move.nodeId)}
        />

        {/* Move Tree Viewer */}
        <div className="h-[280px]">
          <MoveTreeViewer
            moveTree={moveTree}
            currentNodeId={currentNodeId}
            onSelectNode={goToNode}
            onPromoteVariation={promoteVariation}
            onDeleteVariation={deleteVariation}
            onOpenCommentEditor={(id) => setCommentEditingNodeId(id)}
          />
        </div>

        {/* Position Diagnostics */}
        <PositionInfoPanel
          fen={fen}
          turn={turn}
          isCheck={isCheck}
          materialBalance={materialBalance}
          onOpenFENModal={() => setIsFENModalOpen(true)}
        />
      </div>

      {/* Comment Editor Dialog */}
      <CommentEditor
        isOpen={Boolean(commentEditingNodeId)}
        initialComment={editingNode?.comment || ''}
        moveSan={editingNode?.san || ''}
        onClose={() => setCommentEditingNodeId(null)}
        onSave={(comment) => {
          if (commentEditingNodeId) {
            setComment(commentEditingNodeId, comment);
          }
        }}
      />

      {/* PGN / FEN Import & Export Modal */}
      <FENModal
        currentFen={fen}
        pgn={moveTree.exportTreePGN()}
        isOpen={isFENModalOpen}
        onClose={() => setIsFENModalOpen(false)}
        onLoadFen={(loadedFen) => loadFromFEN(loadedFen)}
        onLoadPGN={(loadedPgn) => loadFromPGN(loadedPgn)}
      />
    </div>
  );
};
