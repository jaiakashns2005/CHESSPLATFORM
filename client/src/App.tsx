import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { ChessBoard } from './components/board/ChessBoard';
import { PlayerCard } from './components/game/PlayerCard';
import { MoveHistory } from './components/game/MoveHistory';
import { GameControls } from './components/game/GameControls';
import { GameStatusBanner } from './components/game/GameStatusBanner';
import { FENModal } from './components/game/FENModal';
import { TimeControlModal } from './components/clock/TimeControlModal';
import { DrawOfferModal } from './components/game/DrawOfferModal';
import { AnalysisWorkspace } from './components/analysis/AnalysisWorkspace';
import { PositionEditor } from './components/editor/PositionEditor';
import { PuzzleWorkspace } from './components/puzzles/PuzzleWorkspace';
import { OpeningWorkspace } from './components/openings/OpeningWorkspace';
import { PositionalWorkspace } from './components/positional/PositionalWorkspace';
import { EndgameWorkspace } from './components/endgame/EndgameWorkspace';
import { CoachWorkspace } from './components/coach/CoachWorkspace';
import { useChessGame } from './hooks/useChessGame';
import { BOARD_THEMES } from './utils/chessUtils';
import { BoardTheme, MoveHistoryItem } from './types/chess';
import { ActiveAppView } from './types/analysis';
import { BrainCircuit, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<BoardTheme>(BOARD_THEMES[0]);
  const [activeView, setActiveView] = useState<ActiveAppView>('play');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFENModalOpen, setIsFENModalOpen] = useState(false);
  const [isTimeControlModalOpen, setIsTimeControlModalOpen] = useState(false);

  // Analysis transfer state
  const [analysisHistory, setAnalysisHistory] = useState<MoveHistoryItem[] | undefined>(undefined);
  const [analysisInitialFen, setAnalysisInitialFen] = useState<string | undefined>(undefined);

  const {
    fen,
    turn,
    isCheck,
    isGameOver,
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
    whiteTimeMs,
    blackTimeMs,
    isClockRunning,
    clockActiveColor,
    drawOffer,
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
  } = useChessGame({
    soundEnabled,
  });

  // Transfer current game from Play to Analysis
  const handleAnalyzeCurrentGame = () => {
    setAnalysisHistory([...history]);
    setAnalysisInitialFen(undefined);
    setActiveView('analysis');
  };

  // Load position from editor into analysis
  const handleLoadEditorIntoAnalysis = (editorFen: string) => {
    setAnalysisHistory([]);
    setAnalysisInitialFen(editorFen);
    setActiveView('analysis');
  };

  // Play game from custom editor position
  const handlePlayFromPosition = (editorFen: string) => {
    resetGame(editorFen, timeControl);
    setActiveView('play');
  };

  // Top and Bottom player colors depending on orientation
  const topColor = orientation === 'white' ? 'b' : 'w';
  const bottomColor = orientation === 'white' ? 'w' : 'b';

  return (
    <Layout
      currentTheme={currentTheme}
      activeView={activeView}
      onSelectTheme={setCurrentTheme}
      onSelectView={setActiveView}
    >
      {/* 1. PLAY MODE (Phase 1 & 2) */}
      {activeView === 'play' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start animate-fade-in">
          {/* Left Column: Board, Clocks & Players */}
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Status Banner */}
            <div className="w-full max-w-[640px]">
              <GameStatusBanner
                isCheck={isCheck}
                turn={turn}
                isGameOver={isGameOver}
                result={result}
              />
            </div>

            {/* Top Player Card with Clock */}
            <div className="w-full max-w-[640px]">
              <PlayerCard
                name={topColor === 'w' ? 'White (Player 1)' : 'Black (Player 2)'}
                rating={1500}
                color={topColor}
                isTurn={turn === topColor && !isGameOver}
                capturedPieces={topColor === 'w' ? materialBalance.whiteCaptured : materialBalance.blackCaptured}
                advantageDiff={materialBalance.advantageDiff}
                hasAdvantage={materialBalance.advantageColor === topColor}
                timeMs={topColor === 'w' ? whiteTimeMs : blackTimeMs}
                timeControl={timeControl}
                isClockActive={isClockRunning && clockActiveColor === topColor}
              />
            </div>

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
              onSquareClick={handleSquareClick}
              onDropMove={handleDropMove}
              onConfirmPromotion={confirmPromotion}
              onCancelPromotion={cancelPromotion}
            />

            {/* Bottom Player Card with Clock */}
            <div className="w-full max-w-[640px]">
              <PlayerCard
                name={bottomColor === 'w' ? 'White (Player 1)' : 'Black (Player 2)'}
                rating={1500}
                color={bottomColor}
                isTurn={turn === bottomColor && !isGameOver}
                capturedPieces={bottomColor === 'w' ? materialBalance.whiteCaptured : materialBalance.blackCaptured}
                advantageDiff={materialBalance.advantageDiff}
                hasAdvantage={materialBalance.advantageColor === bottomColor}
                timeMs={bottomColor === 'w' ? whiteTimeMs : blackTimeMs}
                timeControl={timeControl}
                isClockActive={isClockRunning && clockActiveColor === bottomColor}
              />
            </div>
          </div>

          {/* Right Column: Move History, Game Controls & Quick Help */}
          <div className="flex flex-col gap-4 w-full">
            {/* Move History Table */}
            <div className="h-[300px] md:h-[340px]">
              <MoveHistory
                history={history}
                viewingIndex={viewingIndex}
                onJumpToMove={jumpToMove}
                onStepBackward={stepBackward}
                onStepForward={stepForward}
                onJumpToStart={jumpToStart}
                onJumpToEnd={jumpToEnd}
              />
            </div>

            {/* Action & Game Controls */}
            <GameControls
              turn={turn}
              isGameOver={isGameOver}
              canUndo={history.length > 0 && viewingIndex === null}
              soundEnabled={soundEnabled}
              timeControl={timeControl}
              onNewGame={() => resetGame()}
              onRematch={rematch}
              onFlipBoard={flipBoard}
              onUndoMove={undoMove}
              onOpenFENModal={() => setIsFENModalOpen(true)}
              onOpenTimeControlModal={() => setIsTimeControlModalOpen(true)}
              onResign={resign}
              onOfferDraw={offerDraw}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
            />

            {/* Analyze Current Game Banner */}
            <button
              onClick={handleAnalyzeCurrentGame}
              className="w-full py-3 px-4 rounded-lg bg-chess-card hover:bg-chess-surface border border-chess-accent/40 hover:border-chess-accent text-chess-accent font-bold text-xs flex items-center justify-between shadow-md transition-all group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-chess-accent" />
                <span className="text-gray-100">Analyze Current Game</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-chess-accent font-semibold group-hover:translate-x-1 transition-transform">
                <span>Open Analysis Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. ADVANCED ANALYSIS WORKSPACE (Phase 3) */}
      {activeView === 'analysis' && (
        <AnalysisWorkspace
          currentTheme={currentTheme}
          initialHistory={analysisHistory}
          initialFen={analysisInitialFen}
        />
      )}

      {/* 3. POSITION SETUP / BOARD EDITOR (Phase 3) */}
      {activeView === 'editor' && (
        <PositionEditor
          currentTheme={currentTheme}
          onLoadIntoAnalysis={handleLoadEditorIntoAnalysis}
          onPlayFromPosition={handlePlayFromPosition}
        />
      )}

      {activeView === 'puzzles' && <PuzzleWorkspace currentTheme={currentTheme} />}

      {activeView === 'openings' && <OpeningWorkspace currentTheme={currentTheme} />}

      {activeView === 'positional' && <PositionalWorkspace currentTheme={currentTheme} />}

      {activeView === 'endgame' && <EndgameWorkspace currentTheme={currentTheme} />}

      {activeView === 'coach' && <CoachWorkspace currentTheme={currentTheme} onSelectView={setActiveView} />}

      {/* Time Control Selection Modal */}
      <TimeControlModal
        isOpen={isTimeControlModalOpen}
        currentTimeControl={timeControl}
        onClose={() => setIsTimeControlModalOpen(false)}
        onSelectTimeControl={changeTimeControl}
      />

      {/* Draw Offer Modal */}
      <DrawOfferModal
        isOpen={drawOffer.isOffered}
        offeredBy={drawOffer.offeredBy}
        onAccept={acceptDraw}
        onDecline={declineDraw}
      />

      {/* FEN / PGN Setup Modal */}
      <FENModal
        currentFen={fen}
        pgn={exportPGN()}
        isOpen={isFENModalOpen}
        onClose={() => setIsFENModalOpen(false)}
        onLoadFen={(loadedFen) => resetGame(loadedFen)}
        onLoadPGN={loadPGN}
      />
    </Layout>
  );
};

export default App;
