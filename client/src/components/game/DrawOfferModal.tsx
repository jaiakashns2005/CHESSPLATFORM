import React from 'react';
import { PieceColor } from '../../types/chess';
import { Handshake, Check, X } from 'lucide-react';

interface DrawOfferModalProps {
  isOpen: boolean;
  offeredBy: PieceColor | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const DrawOfferModal: React.FC<DrawOfferModalProps> = ({
  isOpen,
  offeredBy,
  onAccept,
  onDecline,
}) => {
  if (!isOpen || !offeredBy) return null;

  const offeringPlayer = offeredBy === 'w' ? 'White' : 'Black';
  const receivingPlayer = offeredBy === 'w' ? 'Black' : 'White';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-chess-card border border-amber-500/50 rounded-xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
          <Handshake className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-100">Draw Offered</h3>
          <p className="text-xs text-gray-300 mt-1">
            <strong className="text-white">{offeringPlayer}</strong> has offered a draw to <strong className="text-white">{receivingPlayer}</strong>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          <button
            onClick={onAccept}
            className="py-2.5 px-4 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Accept Draw
          </button>
          <button
            onClick={onDecline}
            className="py-2.5 px-4 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-200 border border-chess-border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};
