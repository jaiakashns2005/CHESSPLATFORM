import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, X, Trash2 } from 'lucide-react';

interface CommentEditorProps {
  isOpen: boolean;
  initialComment: string;
  moveSan: string;
  onClose: () => void;
  onSave: (comment: string) => void;
}

export const CommentEditor: React.FC<CommentEditorProps> = ({
  isOpen,
  initialComment,
  moveSan,
  onClose,
  onSave,
}) => {
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    setComment(initialComment);
  }, [initialComment, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(comment);
    onClose();
  };

  const handleClear = () => {
    onSave('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-chess-card border border-chess-border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chess-border pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-gray-100">
              Position Commentary {moveSan ? `(${moveSan})` : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Area */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Analysis Notes & Strategic Ideas
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. White sacrifices the exchange for strong diagonal pressure against the exposed king..."
            className="w-full bg-chess-bg border border-chess-border rounded-lg p-3 text-xs text-gray-100 focus:outline-none focus:border-chess-accent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {initialComment ? (
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-lg bg-chess-surface hover:bg-rose-950/40 text-rose-300 border border-chess-border hover:border-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-chess-surface hover:bg-chess-border text-gray-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
