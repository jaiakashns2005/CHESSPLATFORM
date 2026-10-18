import { ActiveAppView } from '../types/analysis';

const phaseLabels: Record<ActiveAppView, string> = {
  play: 'Phase 2: Play',
  analysis: 'Phase 4: Analysis and Game Review',
  editor: 'Phase 3: Board Editor',
  puzzles: 'Phase 6: Puzzle Training',
  openings: 'Phase 7: Opening Training',
  positional: 'Phase 8: Positional Training',
  endgame: 'Phase 9: Endgame Training',
  coach: 'Phase 10: AI Coach',
};

export const getAppPhaseLabel = (view: ActiveAppView): string => phaseLabels[view];
