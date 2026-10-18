import React from 'react';
import { Swords, Palette, Award, Sparkles, BookOpen, BrainCircuit, LayoutGrid, Crosshair, Crown } from 'lucide-react';
import { BoardTheme } from '../../types/chess';
import { ActiveAppView } from '../../types/analysis';
import { BOARD_THEMES } from '../../utils/chessUtils';
import { getAppPhaseLabel } from '../../utils/appPhaseLabels';

interface NavbarProps {
  currentTheme: BoardTheme;
  activeView: ActiveAppView;
  onSelectTheme: (theme: BoardTheme) => void;
  onSelectView: (view: ActiveAppView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTheme,
  activeView,
  onSelectTheme,
  onSelectView,
}) => {
  return (
    <header className="bg-chess-card border-b border-chess-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-chess-accent flex items-center justify-center text-white shadow-lg shadow-chess-accent/20">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white">CHESS PLATFORM</h1>
              <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-chess-accent/20 text-chess-accent border border-chess-accent/30">
                {getAppPhaseLabel(activeView)}
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-gray-400 font-medium">Tournament Engine & Training Ecosystem</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-0.5 bg-chess-surface p-1 rounded-lg border border-chess-border sm:order-none sm:w-auto sm:flex-nowrap sm:justify-center sm:gap-1">
          <button
            onClick={() => onSelectView('play')}
            title="Play"
            aria-label="Play"
            className={`px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeView === 'play'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Play</span>
          </button>
          <button
            onClick={() => onSelectView('analysis')}
            title="Analysis"
            aria-label="Analysis"
            className={`px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeView === 'analysis'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analysis</span>
          </button>
          <button
            onClick={() => onSelectView('editor')}
            title="Board Editor"
            aria-label="Board Editor"
            className={`px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeView === 'editor'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Board Editor</span>
          </button>
          <button
            onClick={() => onSelectView('puzzles')}
            title="Puzzles"
            aria-label="Puzzles"
            className={`px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeView === 'puzzles'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Puzzles</span>
          </button>
          <button
            onClick={() => onSelectView('openings')}
            title="Opening Training"
            aria-label="Opening Training"
            className={`px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeView === 'openings'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Openings</span>
          </button>
          <button
            onClick={() => onSelectView('positional')}
            title="Positional Training"
            aria-label="Positional Training"
            className={`px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeView === 'positional'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Positional</span>
          </button>
          <button
            onClick={() => onSelectView('endgame')}
            title="Endgame Training"
            aria-label="Endgame Training"
            className={`px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeView === 'endgame'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Endgame</span>
          </button>
          <button
            onClick={() => onSelectView('coach')}
            title="AI Coach"
            aria-label="AI Coach"
            className={`flex px-1 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all items-center gap-1 sm:gap-1.5 ${
              activeView === 'coach'
                ? 'bg-chess-accent text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Coach</span>
          </button>
        </nav>

        {/* Theme & Profile Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-chess-surface px-3 py-1.5 rounded-lg border border-chess-border">
            <Palette className="w-4 h-4 text-chess-accent" />
            <select
              value={currentTheme.id}
              onChange={(e) => {
                const found = BOARD_THEMES.find((t) => t.id === e.target.value);
                if (found) onSelectTheme(found);
              }}
              className="bg-transparent text-xs font-semibold text-gray-200 focus:outline-none cursor-pointer"
            >
              {BOARD_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id} className="bg-chess-card text-gray-200">
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
