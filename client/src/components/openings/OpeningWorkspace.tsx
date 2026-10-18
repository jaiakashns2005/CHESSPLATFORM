import React, { useMemo, useState } from 'react';
import { BookOpen, Check, Heart, RotateCcw, Search, Swords } from 'lucide-react';
import { ChessBoard } from '../board/ChessBoard';
import { useOpeningTraining } from '../../hooks/useOpeningTraining';
import { useStockfish } from '../../hooks/useStockfish';
import { OPENING_REPERTOIRE } from '../../core/openings/openingRepertoire';
import { getOpeningAccuracy, getOpeningProgress } from '../../core/openings/openingProgress';
import { BoardTheme, PieceColor } from '../../types/chess';
import { OpeningLine } from '../../types/opening';

interface OpeningWorkspaceProps {
  currentTheme: BoardTheme;
}

export const OpeningWorkspace: React.FC<OpeningWorkspaceProps> = ({ currentTheme }) => {
  const [selectedOpening, setSelectedOpening] = useState<OpeningLine>(OPENING_REPERTOIRE[0]);
  const [query, setQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const training = useOpeningTraining(selectedOpening);
  const engine = useStockfish(training.fen, { initialDepth: 12, initialMultiPv: 1, autoStart: true });

  const families = useMemo(() => [...new Set(OPENING_REPERTOIRE.map((opening) => opening.family))], []);
  const filteredOpenings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return OPENING_REPERTOIRE.filter((opening) => {
      const matchesQuery = !normalized || `${opening.name} ${opening.family} ${opening.variation} ${opening.description}`.toLowerCase().includes(normalized);
      const matchesFamily = familyFilter === 'all' || opening.family === familyFilter;
      const matchesFavorite = !favoritesOnly || training.progress.favorites.includes(opening.id);
      return matchesQuery && matchesFamily && matchesFavorite;
    });
  }, [familyFilter, favoritesOnly, query, training.progress.favorites]);

  const lineProgress = getOpeningProgress(training.progress, selectedOpening.id);
  const practicedLines = Object.values(training.progress.byOpening).reduce((total, item) => total + item.linesPracticed, 0);
  const shownPlies = training.mode === 'practice' ? training.plies.slice(0, training.cursor) : training.plies;

  const selectOpening = (opening: OpeningLine) => {
    setSelectedOpening(opening);
  };

  const startPractice = (color: PieceColor) => training.startPractice(color);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-chess-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-chess-accent mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Phase 7 Training</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Opening Training</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Metric label="Lines practiced" value={practicedLines} />
          <Metric label="Correct moves" value={training.progress.byOpening[selectedOpening.id]?.movesCorrect || 0} />
          <Metric label="Opening accuracy" value={`${getOpeningAccuracy(lineProgress)}%`} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.8fr)] gap-4 items-start">
        <aside className="bg-chess-card border border-chess-border rounded-lg overflow-hidden">
          <div className="p-3 border-b border-chess-border space-y-2.5">
            <label className="flex items-center gap-2 bg-chess-bg border border-chess-border rounded px-2.5 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                aria-label="Search openings"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search openings or variations"
                className="w-full min-w-0 bg-transparent text-xs text-gray-100 placeholder:text-gray-600 outline-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter opening family"
                value={familyFilter}
                onChange={(event) => setFamilyFilter(event.target.value)}
                className="min-w-0 flex-1 bg-chess-bg border border-chess-border rounded px-2 py-1.5 text-xs text-gray-200"
              >
                <option value="all">All families</option>
                {families.map((family) => <option key={family} value={family}>{family}</option>)}
              </select>
              <button
                onClick={() => setFavoritesOnly((value) => !value)}
                aria-pressed={favoritesOnly}
                title={favoritesOnly ? 'Show all openings' : 'Show favorite openings'}
                className={`p-2 rounded border ${favoritesOnly ? 'border-rose-700 bg-rose-950/40 text-rose-300' : 'border-chess-border bg-chess-surface text-gray-400 hover:text-rose-300'}`}
              >
                <Heart className={`w-4 h-4 ${favoritesOnly ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto divide-y divide-chess-border/70">
            {filteredOpenings.map((opening) => {
              const selected = selectedOpening.id === opening.id;
              const favorite = training.progress.favorites.includes(opening.id);
              const stats = getOpeningProgress(training.progress, opening.id);
              return (
                <div key={opening.id} className={`flex items-stretch gap-1 px-2 py-2 ${selected ? 'bg-chess-accent/10' : 'hover:bg-chess-surface/60'}`}>
                  <button onClick={() => selectOpening(opening)} className="min-w-0 flex-1 text-left px-2 py-1">
                    <span className="block text-[10px] text-gray-500">{opening.family}</span>
                    <span className={`block truncate text-xs font-bold ${selected ? 'text-chess-accent' : 'text-gray-100'}`}>{opening.name}</span>
                    <span className="block truncate text-[10px] text-gray-400">{opening.variation}</span>
                    {stats.linesPracticed > 0 && <span className="block mt-1 text-[9px] text-emerald-300">Practiced {stats.linesPracticed}× · {getOpeningAccuracy(stats)}% moves</span>}
                  </button>
                  <button
                    onClick={() => { selectOpening(opening); training.toggleFavorite(opening.id); }}
                    aria-label={favorite ? `Remove ${opening.variation} from favorites` : `Add ${opening.variation} to favorites`}
                    title={favorite ? 'Remove favorite' : 'Add favorite'}
                    className={`self-start p-1.5 rounded ${favorite ? 'text-rose-300' : 'text-gray-600 hover:text-rose-300'}`}
                  >
                    <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            })}
            {filteredOpenings.length === 0 && <p className="p-5 text-center text-xs text-gray-500">No openings match these filters.</p>}
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.85fr)] gap-4 items-start">
            <div className="bg-chess-card border border-chess-border rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-chess-accent">{selectedOpening.family} · {selectedOpening.variation}</p>
                  <h3 className="text-base font-bold text-gray-100 mt-0.5">{selectedOpening.name}</h3>
                  <p className="mt-1 text-xs text-gray-400 leading-relaxed">{selectedOpening.description}</p>
                </div>
                <button
                  onClick={() => training.toggleFavorite()}
                  aria-label={training.progress.favorites.includes(selectedOpening.id) ? 'Remove opening from favorites' : 'Add opening to favorites'}
                  className={`p-2 rounded border ${training.progress.favorites.includes(selectedOpening.id) ? 'border-rose-800 text-rose-300' : 'border-chess-border text-gray-500 hover:text-rose-300'}`}
                >
                  <Heart className={`w-4 h-4 ${training.progress.favorites.includes(selectedOpening.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500">{training.mode === 'practice' ? `Practice ${training.practiceColor === 'w' ? 'White' : 'Black'}` : `Position ${training.cursor} of ${training.plies.length}`}</span>
                {training.mode === 'explore' ? (
                  <div className="flex gap-1">
                    <button onClick={() => startPractice('w')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-chess-accent text-white text-[10px] font-bold"><Swords className="w-3 h-3" /> Practice White</button>
                    <button onClick={() => startPractice('b')} className="px-2.5 py-1.5 rounded border border-chess-border bg-chess-surface text-gray-200 text-[10px] font-bold">Practice Black</button>
                  </div>
                ) : (
                  <button onClick={training.restart} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-chess-border bg-chess-surface text-gray-200 text-[10px] font-bold"><RotateCcw className="w-3 h-3" /> Restart line</button>
                )}
              </div>

              <div className="max-w-[560px] mx-auto">
                <ChessBoard
                  fen={training.fen}
                  turn={training.turn}
                  orientation={training.orientation}
                  theme={currentTheme}
                  selectedSquare={training.selectedSquare}
                  legalMoves={training.legalMoves}
                  lastMove={training.lastMove}
                  pendingPromotion={null}
                  isCheck={training.isCheck}
                  isGameOver={training.mode !== 'practice' || training.feedback === 'complete'}
                  onSquareClick={training.handleSquareClick}
                  onDropMove={training.handleDropMove}
                  onConfirmPromotion={() => undefined}
                  onCancelPromotion={() => undefined}
                />
              </div>
              <div className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${training.feedback === 'correct' ? 'border-emerald-800 bg-emerald-950/30 text-emerald-200' : training.feedback === 'incorrect' ? 'border-amber-800 bg-amber-950/30 text-amber-200' : training.feedback === 'complete' ? 'border-cyan-800 bg-cyan-950/30 text-cyan-100' : 'border-chess-border bg-chess-surface text-gray-300'}`} role="status" aria-live="polite">
                {training.feedback === 'correct' || training.feedback === 'complete' ? <Check className="w-4 h-4 shrink-0" /> : null}
                <span>{training.message}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-chess-card border border-chess-border rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Opening line</h4>
                  <button onClick={() => training.explorePly(0)} className="text-[10px] text-chess-accent hover:text-white">Start position</button>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="Opening moves">
                  {shownPlies.map((ply, index) => (
                    <button
                      key={`${selectedOpening.id}-${index}`}
                      onClick={() => training.explorePly(index + 1)}
                      disabled={training.mode === 'practice'}
                      className={`px-1.5 py-1 rounded font-mono text-[11px] border ${training.cursor === index + 1 ? 'bg-chess-accent text-white border-chess-accent' : 'bg-chess-surface border-chess-border text-gray-200'} disabled:cursor-default`}
                    >
                      {ply.moveNumber}{ply.color === 'w' ? '.' : '...'} {ply.san}
                    </button>
                  ))}
                  {training.mode === 'explore' && training.plies.length === 0 && <span className="text-xs text-gray-500">No moves in this line.</span>}
                </div>
                {training.mode === 'practice' && <p className="mt-2 text-[10px] text-gray-500">Future book moves stay hidden while you practice.</p>}
              </div>

              <div className="bg-chess-card border border-chess-border rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Position insight</h4>
                  <span className="text-[9px] font-mono text-gray-500">{engine.isAnalyzing ? `Stockfish depth ${engine.currentDepth || '…'}` : engine.status}</span>
                </div>
                <p className="text-xs text-gray-300">Evaluation <strong className="font-mono text-gray-100">{engine.topEvaluation?.scoreDisplay || 'Calculating'}</strong></p>
                {training.mode === 'explore' && engine.bestMoveSan && <p className="mt-1 text-xs text-gray-400">Engine candidate: <strong className="font-mono text-cyan-200">{engine.bestMoveSan}</strong></p>}
                {training.mode === 'practice' && <p className="mt-1 text-[10px] text-gray-500">Engine candidate hidden during practice.</p>}
                {engine.error && <p className="mt-2 text-[10px] text-rose-300">Stockfish unavailable: {engine.error}</p>}
                <p className="mt-2 text-[10px] text-gray-500">Position FEN</p>
                <p className="break-all font-mono text-[9px] leading-relaxed text-gray-500">{training.fen}</p>
              </div>

              <div className="bg-chess-card border border-chess-border rounded-lg p-3 sm:p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Practice progress</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Completed lines" value={lineProgress.linesPracticed} />
                  <Metric label="Move accuracy" value={`${getOpeningAccuracy(lineProgress)}%`} />
                  <Metric label="Correct moves" value={lineProgress.movesCorrect} />
                  <Metric label="Move attempts" value={lineProgress.movesAttempted} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="min-w-0 rounded border border-chess-border bg-chess-surface px-2.5 py-2">
    <div className="truncate text-[9px] text-gray-500">{label}</div>
    <div className="mt-0.5 font-mono text-xs font-bold text-gray-100">{value}</div>
  </div>
);