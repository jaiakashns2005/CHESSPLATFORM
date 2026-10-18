import React, { useState } from 'react';
import { Copy, Check, FileText, Play, X, AlertCircle, Download, Upload } from 'lucide-react';
import { isValidFEN, STARTING_FEN, downloadPGNFile } from '../../utils/chessUtils';

interface FENModalProps {
  currentFen: string;
  pgn: string;
  isOpen: boolean;
  onClose: () => void;
  onLoadFen: (fen: string) => void;
  onLoadPGN: (pgn: string) => { success: boolean; error?: string };
}

const PRESET_POSITIONS = [
  {
    name: 'Starting Position',
    fen: STARTING_FEN,
    description: 'Standard initial board setup.',
  },
  {
    name: "Scholar's Mate Setup",
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    description: 'White can deliver checkmate on f7 with Qxf7#.',
  },
  {
    name: 'Pawn Promotion Test',
    fen: '8/4P3/8/8/8/8/4p3/k3K3 w - - 0 1',
    description: 'White pawn on e7 and Black pawn on e2 ready to promote.',
  },
  {
    name: 'Castling Test Position',
    fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    description: 'Both sides have full Kingside and Queenside castling rights.',
  },
  {
    name: 'En Passant Test',
    fen: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
    description: 'White pawn on e5 can capture Black pawn on f5 en passant via exf6.',
  },
  {
    name: 'Stalemate Test',
    fen: 'k7/8/1Q6/8/8/8/8/7K b - - 0 1',
    description: 'Black king on a8 has no legal moves and is not in check (Stalemate).',
  },
  {
    name: 'Lucena Position (Rook Endgame)',
    fen: '1K1R4/1P6/k7/8/8/8/8/2r5 w - - 0 1',
    description: 'Fundamental winning technique in rook endgames (Bridge building).',
  },
];

export const FENModal: React.FC<FENModalProps> = ({
  currentFen,
  pgn,
  isOpen,
  onClose,
  onLoadFen,
  onLoadPGN,
}) => {
  const [activeTab, setActiveTab] = useState<'pgn' | 'fen' | 'presets'>('pgn');
  const [inputFen, setInputFen] = useState(currentFen);
  const [inputPgn, setInputPgn] = useState('');
  const [copiedFen, setCopiedFen] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [fenError, setFenError] = useState<string | null>(null);
  const [pgnError, setPgnError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyFen = () => {
    navigator.clipboard.writeText(currentFen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(pgn || 'No moves yet.');
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleDownloadPgn = () => {
    downloadPGNFile(pgn || '', `chess-game-${Date.now()}.pgn`);
  };

  const handleLoadCustomFen = () => {
    const validation = isValidFEN(inputFen);
    if (!validation.valid) {
      setFenError(validation.error || 'Invalid FEN notation');
      return;
    }
    setFenError(null);
    onLoadFen(inputFen.trim());
    onClose();
  };

  const handleImportPGN = () => {
    if (!inputPgn.trim()) {
      setPgnError('Please enter a PGN text string.');
      return;
    }

    const result = onLoadPGN(inputPgn.trim());
    if (!result.success) {
      setPgnError(result.error || 'Failed to parse PGN.');
      return;
    }

    setPgnError(null);
    onClose();
  };

  const handleSelectPreset = (fen: string) => {
    onLoadFen(fen);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-chess-card border border-chess-border rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-chess-border flex items-center justify-between bg-chess-surface">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-chess-accent" />
            <h3 className="font-bold text-base text-gray-100">PGN & FEN Game Data</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-100 hover:bg-chess-border/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-chess-border bg-chess-bg/60">
          <button
            onClick={() => setActiveTab('pgn')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'pgn'
                ? 'border-chess-accent text-chess-accent bg-chess-surface'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            PGN (Import & Export)
          </button>
          <button
            onClick={() => setActiveTab('fen')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'fen'
                ? 'border-chess-accent text-chess-accent bg-chess-surface'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            FEN String
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'presets'
                ? 'border-chess-accent text-chess-accent bg-chess-surface'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Tactical Presets
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'pgn' && (
            <div className="space-y-4">
              {/* Current Game PGN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Current Game PGN
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyPgn}
                      className="text-[11px] text-gray-300 hover:text-white flex items-center gap-1 bg-chess-surface px-2 py-0.5 rounded border border-chess-border"
                    >
                      {copiedPgn ? <Check className="w-3 h-3 text-chess-accent" /> : <Copy className="w-3 h-3" />}
                      {copiedPgn ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownloadPgn}
                      className="text-[11px] text-gray-300 hover:text-white flex items-center gap-1 bg-chess-surface px-2 py-0.5 rounded border border-chess-border"
                    >
                      <Download className="w-3 h-3 text-chess-accent" />
                      Download .pgn
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={5}
                  value={pgn}
                  className="w-full bg-chess-bg border border-chess-border rounded-lg p-2.5 text-xs font-mono text-gray-200 select-all focus:outline-none"
                />
              </div>

              {/* Import PGN */}
              <div className="border-t border-chess-border/60 pt-4">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Import & Replay External PGN
                </label>
                <textarea
                  rows={4}
                  value={inputPgn}
                  onChange={(e) => {
                    setInputPgn(e.target.value);
                    setPgnError(null);
                  }}
                  placeholder="Paste PGN notation here (e.g. 1. e4 e5 2. Nf3 Nc6 3. Bc4...)..."
                  className="w-full bg-chess-bg border border-chess-border rounded-lg p-2.5 text-xs font-mono text-gray-100 focus:outline-none focus:border-chess-accent"
                />

                {pgnError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pgnError}</span>
                  </div>
                )}

                <button
                  onClick={handleImportPGN}
                  className="mt-3 w-full py-2.5 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <Upload className="w-4 h-4" />
                  Load and Replay PGN Game
                </button>
              </div>
            </div>
          )}

          {activeTab === 'fen' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Current Board FEN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentFen}
                    className="w-full bg-chess-bg border border-chess-border rounded-lg px-3 py-2 text-xs font-mono text-gray-200 select-all"
                  />
                  <button
                    onClick={handleCopyFen}
                    className="px-3 py-2 rounded-lg bg-chess-surface border border-chess-border hover:bg-chess-border text-gray-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedFen ? <Check className="w-4 h-4 text-chess-accent" /> : <Copy className="w-4 h-4" />}
                    {copiedFen ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="border-t border-chess-border/60 pt-4">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Load Custom FEN Position
                </label>
                <textarea
                  rows={3}
                  value={inputFen}
                  onChange={(e) => {
                    setInputFen(e.target.value);
                    setFenError(null);
                  }}
                  placeholder="Paste valid Forsyth-Edwards Notation here..."
                  className="w-full bg-chess-bg border border-chess-border rounded-lg p-3 text-xs font-mono text-gray-100 focus:outline-none focus:border-chess-accent"
                />
                {fenError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fenError}</span>
                  </div>
                )}
                <button
                  onClick={handleLoadCustomFen}
                  className="mt-3 w-full py-2.5 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Load Position onto Board
                </button>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-2">
              {PRESET_POSITIONS.map((preset) => (
                <div
                  key={preset.name}
                  className="p-3 rounded-lg bg-chess-surface border border-chess-border hover:border-chess-accent/60 transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <h5 className="font-bold text-xs text-gray-200 group-hover:text-chess-accent transition-colors">
                      {preset.name}
                    </h5>
                    <p className="text-[11px] text-gray-400 mt-0.5">{preset.description}</p>
                  </div>
                  <button
                    onClick={() => handleSelectPreset(preset.fen)}
                    className="px-3 py-1.5 rounded-md bg-chess-card border border-chess-border group-hover:bg-chess-accent group-hover:text-white text-xs font-bold text-gray-200 transition-all shrink-0"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
