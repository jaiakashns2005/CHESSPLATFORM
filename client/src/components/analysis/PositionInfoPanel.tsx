import React, { useState } from 'react';
import { MaterialBalance, PieceColor } from '../../types/chess';
import { CapturedPieces } from '../board/CapturedPieces';
import { Copy, Check, FileCode } from 'lucide-react';

interface PositionInfoPanelProps {
  fen: string;
  turn: PieceColor;
  isCheck: boolean;
  materialBalance: MaterialBalance;
  onOpenFENModal: () => void;
}

export const PositionInfoPanel: React.FC<PositionInfoPanelProps> = ({
  fen,
  turn,
  isCheck,
  materialBalance,
  onOpenFENModal,
}) => {
  const [copiedFen, setCopiedFen] = useState(false);

  const handleCopyFen = () => {
    navigator.clipboard.writeText(fen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Position Status & Turn Card */}
      <div className="bg-chess-card border border-chess-border rounded-lg p-3 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                turn === 'w' ? 'bg-white ring-2 ring-gray-400' : 'bg-gray-950 ring-2 ring-gray-600'
              }`}
            />
            <span className="font-bold text-xs text-gray-200">
              {turn === 'w' ? 'White to Move' : 'Black to Move'}
            </span>
            {isCheck && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                Check
              </span>
            )}
          </div>

          <button
            onClick={onOpenFENModal}
            className="flex items-center gap-1 text-[11px] font-semibold text-chess-accent hover:text-chess-accentHover bg-chess-accent/15 px-2 py-1 rounded border border-chess-accent/30 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>PGN / FEN</span>
          </button>
        </div>

        {/* Material Balance & Captured Trays */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-chess-border/60">
          <div className="bg-chess-surface p-2 rounded border border-chess-border/60">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">White Pieces Lost</div>
            <CapturedPieces
              captured={materialBalance.blackCaptured}
              capturedPieceColor="w"
              advantageDiff={materialBalance.advantageDiff}
              hasAdvantage={materialBalance.advantageColor === 'w'}
            />
          </div>

          <div className="bg-chess-surface p-2 rounded border border-chess-border/60">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Black Pieces Lost</div>
            <CapturedPieces
              captured={materialBalance.whiteCaptured}
              capturedPieceColor="b"
              advantageDiff={materialBalance.advantageDiff}
              hasAdvantage={materialBalance.advantageColor === 'b'}
            />
          </div>
        </div>

        {/* FEN Box */}
        <div className="pt-2 border-t border-chess-border/60">
          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 mb-1">
            <span>POSITION FEN</span>
            <button
              onClick={handleCopyFen}
              className="text-gray-300 hover:text-white flex items-center gap-1"
            >
              {copiedFen ? <Check className="w-3 h-3 text-chess-accent" /> : <Copy className="w-3 h-3" />}
              {copiedFen ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-chess-bg p-2 rounded border border-chess-border text-[11px] font-mono text-gray-300 truncate select-all">
            {fen}
          </div>
        </div>
      </div>
    </div>
  );
};
