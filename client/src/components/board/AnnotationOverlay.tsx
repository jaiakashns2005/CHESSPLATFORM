import React from 'react';
import { AnnotationColor, BoardArrow, SquareHighlight } from '../../types/analysis';
import { BoardOrientation, ChessSquare } from '../../types/chess';

interface AnnotationOverlayProps {
  arrows: BoardArrow[];
  squareHighlights: SquareHighlight[];
  orientation: BoardOrientation;
}

const COLOR_MAP: Record<AnnotationColor, { stroke: string; fill: string; bg: string }> = {
  green: { stroke: '#22c55e', fill: '#22c55e', bg: 'rgba(34, 197, 94, 0.45)' },
  red: { stroke: '#ef4444', fill: '#ef4444', bg: 'rgba(239, 68, 68, 0.45)' },
  blue: { stroke: '#3b82f6', fill: '#3b82f6', bg: 'rgba(59, 130, 246, 0.45)' },
  yellow: { stroke: '#eab308', fill: '#eab308', bg: 'rgba(234, 179, 8, 0.45)' },
  cyan: { stroke: '#06b6d4', fill: '#06b6d4', bg: 'rgba(6, 182, 212, 0.45)' },
};

const getSquareCenter = (square: ChessSquare, orientation: BoardOrientation): { x: number; y: number } => {
  const fileIdx = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rankIdx = parseInt(square[1], 10) - 1;

  const xIdx = orientation === 'white' ? fileIdx : 7 - fileIdx;
  const yIdx = orientation === 'white' ? 7 - rankIdx : rankIdx;

  return {
    x: (xIdx + 0.5) * 12.5,
    y: (yIdx + 0.5) * 12.5,
  };
};

const getSquareRect = (square: ChessSquare, orientation: BoardOrientation): { x: number; y: number; width: number; height: number } => {
  const fileIdx = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rankIdx = parseInt(square[1], 10) - 1;

  const xIdx = orientation === 'white' ? fileIdx : 7 - fileIdx;
  const yIdx = orientation === 'white' ? 7 - rankIdx : rankIdx;

  return {
    x: xIdx * 12.5,
    y: yIdx * 12.5,
    width: 12.5,
    height: 12.5,
  };
};

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  arrows,
  squareHighlights,
  orientation,
}) => {
  if (arrows.length === 0 && squareHighlights.length === 0) return null;

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      preserveAspectRatio="none"
    >
      <defs>
        {(['green', 'red', 'blue', 'yellow', 'cyan'] as AnnotationColor[]).map((color) => (
          <marker
            key={`arrowhead-${color}`}
            id={`arrowhead-${color}`}
            markerWidth="4"
            markerHeight="4"
            refX="2.5"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill={COLOR_MAP[color].fill} opacity="0.85" />
          </marker>
        ))}
      </defs>

      {/* Square Highlights */}
      {squareHighlights.map((hl) => {
        const rect = getSquareRect(hl.square, orientation);
        const color = COLOR_MAP[hl.color] || COLOR_MAP.green;
        return (
          <rect
            key={`hl-${hl.square}`}
            x={`${rect.x}%`}
            y={`${rect.y}%`}
            width={`${rect.width}%`}
            height={`${rect.height}%`}
            fill={color.bg}
          />
        );
      })}

      {/* Directional Arrows */}
      {arrows.map((arrow) => {
        const start = getSquareCenter(arrow.from, orientation);
        const end = getSquareCenter(arrow.to, orientation);
        const color = COLOR_MAP[arrow.color] || COLOR_MAP.green;

        // Calculate slightly shortened line so arrowhead lands centered
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const shorten = 2.8; // percentage units
        const ratio = dist > 0 ? (dist - shorten) / dist : 1;

        const endX = start.x + dx * ratio;
        const endY = start.y + dy * ratio;

        return (
          <line
            key={arrow.id}
            x1={`${start.x}%`}
            y1={`${start.y}%`}
            x2={`${endX}%`}
            y2={`${endY}%`}
            stroke={color.stroke}
            strokeWidth="1.6"
            strokeOpacity="0.85"
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${arrow.color})`}
          />
        );
      })}
    </svg>
  );
};
