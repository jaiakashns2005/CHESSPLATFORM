import React, { useState } from 'react';
import { TimeControl, TimeControlCategory } from '../../types/chess';
import { TIME_CONTROL_PRESETS } from '../../utils/timeUtils';
import { Clock, Zap, Flame, Timer, Infinity, Sliders, X, Check } from 'lucide-react';

interface TimeControlModalProps {
  isOpen: boolean;
  currentTimeControl: TimeControl;
  onClose: () => void;
  onSelectTimeControl: (timeControl: TimeControl) => void;
}

export const TimeControlModal: React.FC<TimeControlModalProps> = ({
  isOpen,
  currentTimeControl,
  onClose,
  onSelectTimeControl,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customMinutes, setCustomMinutes] = useState<number>(5);
  const [customIncrement, setCustomIncrement] = useState<number>(3);

  if (!isOpen) return null;

  const categories: { key: TimeControlCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'bullet', label: 'Bullet', icon: <Flame className="w-4 h-4 text-amber-500" /> },
    { key: 'blitz', label: 'Blitz', icon: <Zap className="w-4 h-4 text-yellow-400" /> },
    { key: 'rapid', label: 'Rapid', icon: <Timer className="w-4 h-4 text-emerald-400" /> },
    { key: 'classical', label: 'Classical', icon: <Clock className="w-4 h-4 text-blue-400" /> },
    { key: 'unlimited', label: 'Unlimited', icon: <Infinity className="w-4 h-4 text-purple-400" /> },
  ];

  const handleApplyCustom = () => {
    const min = Math.max(1, Math.min(180, customMinutes));
    const inc = Math.max(0, Math.min(60, customIncrement));

    let category: TimeControlCategory = 'rapid';
    if (min <= 2) category = 'bullet';
    else if (min <= 5) category = 'blitz';
    else if (min >= 30) category = 'classical';

    const customTC: TimeControl = {
      id: `custom-${min}+${inc}`,
      name: `${min} + ${inc}`,
      category,
      initialMinutes: min,
      incrementSeconds: inc,
    };

    onSelectTimeControl(customTC);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-chess-card border border-chess-border rounded-xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-chess-border flex items-center justify-between bg-chess-surface">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-chess-accent" />
            <h3 className="font-bold text-base text-gray-100">Select Time Control</h3>
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
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'presets'
                ? 'border-chess-accent text-chess-accent bg-chess-surface'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'custom'
                ? 'border-chess-accent text-chess-accent bg-chess-surface'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Custom Time
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[75vh]">
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {categories.map((cat) => {
                const presets = TIME_CONTROL_PRESETS.filter((tc) => tc.category === cat.key);
                if (presets.length === 0) return null;

                return (
                  <div key={cat.key} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                      {cat.icon}
                      <span>{cat.label}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {presets.map((tc) => {
                        const isSelected = currentTimeControl.id === tc.id;
                        return (
                          <button
                            key={tc.id}
                            onClick={() => {
                              onSelectTimeControl(tc);
                              onClose();
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-chess-accent text-white border-chess-accent shadow-md ring-2 ring-chess-accent/40'
                                : 'bg-chess-surface hover:bg-chess-border text-gray-200 border-chess-border hover:border-chess-accent/50'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            <span>{tc.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-5 py-2">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Initial Time (Minutes)</label>
                  <span className="text-sm font-bold text-chess-accent font-mono">{customMinutes} min</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
                  className="w-full accent-chess-accent cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Increment (Seconds per move)</label>
                  <span className="text-sm font-bold text-chess-accent font-mono">+{customIncrement}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={customIncrement}
                  onChange={(e) => setCustomIncrement(parseInt(e.target.value, 10))}
                  className="w-full accent-chess-accent cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-lg bg-chess-surface border border-chess-border text-center text-xs text-gray-300">
                Summary: <strong className="text-white font-mono">{customMinutes} min + {customIncrement}s increment</strong>
              </div>

              <button
                onClick={handleApplyCustom}
                className="w-full py-2.5 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <Sliders className="w-4 h-4" />
                Apply Custom Time Control
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
