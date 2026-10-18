import React from 'react';
import { BoardOrientation } from '../../types/chess';
import { EngineEvaluation } from '../../types/engine';
import { calculateWinPercentage } from '../../core/engine/moveQuality';

interface EvaluationBarProps {
  evaluation: EngineEvaluation | null;
  orientation: BoardOrientation;
  isEngineActive: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  orientation,
  isEngineActive,
}) => {
  // Compute white win percentage (0 to 100)
  let whitePercent = 50;

  if (isEngineActive && evaluation) {
    if (evaluation.scoreMate !== undefined) {
      // Mate evaluation
      whitePercent = evaluation.scoreMate > 0 ? 100 : 0;
    } else if (evaluation.scoreCp !== undefined) {
      // Centipawn evaluation with logistic curve
      const calculated = calculateWinPercentage(evaluation.scoreCp);
      // Clamp between 3% and 97% for visual balance unless mate
      whitePercent = Math.max(3, Math.min(97, calculated));
    }
  }

  // If orientation is 'black', the bar is viewed from Black's perspective
  const whiteBarHeight = orientation === 'white' ? `${whitePercent}%` : `${100 - whitePercent}%`;
  const isWhiteWinning = (evaluation?.scoreCp ?? 0) >= 0;

  // Display text: e.g. "+1.4", "-0.8", "+M2", "0.0"
  const scoreText = evaluation?.scoreDisplay || '0.0';

  return (
    <div
      title={`Engine Evaluation: ${scoreText}`}
      className="relative w-7 h-full min-h-[360px] max-h-[640px] bg-[#22201d] rounded-md overflow-hidden flex flex-col justify-end border-2 border-[#3b3834] shadow-md select-none"
    >
      {/* Black Area (Top) */}
      <div className="absolute inset-0 bg-[#2b2926]" />

      {/* White Area (Bottom if orientation == 'white') */}
      <div
        style={{ height: whiteBarHeight }}
        className="relative w-full bg-[#f0f0f0] transition-all duration-300 ease-out"
      />

      {/* Score Label overlay */}
      <div
        className={`absolute inset-x-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${
          // Place label in the dominant color half for readable contrast
          (orientation === 'white' && isWhiteWinning) || (orientation === 'black' && !isWhiteWinning)
            ? 'bottom-2 text-[#1a1917]'
            : 'top-2 text-[#f5f5f5]'
        }`}
      >
        <span className="text-[10px] font-black font-mono tracking-tight leading-none px-0.5">
          {scoreText}
        </span>
      </div>
    </div>
  );
};
