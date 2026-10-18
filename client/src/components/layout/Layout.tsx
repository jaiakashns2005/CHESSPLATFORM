import React from 'react';
import { Navbar } from './Navbar';
import { BoardTheme } from '../../types/chess';
import { ActiveAppView } from '../../types/analysis';
import { getAppPhaseLabel } from '../../utils/appPhaseLabels';

interface LayoutProps {
  currentTheme: BoardTheme;
  activeView: ActiveAppView;
  onSelectTheme: (theme: BoardTheme) => void;
  onSelectView: (view: ActiveAppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTheme,
  activeView,
  onSelectTheme,
  onSelectView,
  children,
}) => {
  return (
    <div className="min-h-screen bg-chess-bg flex flex-col selection:bg-chess-accent selection:text-white">
      <Navbar
        currentTheme={currentTheme}
        activeView={activeView}
        onSelectTheme={onSelectTheme}
        onSelectView={onSelectView}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-chess-border py-4 bg-chess-surface/50 text-center text-xs text-gray-500">
        Chess Training & Playing Platform • {getAppPhaseLabel(activeView)}
      </footer>
    </div>
  );
};
