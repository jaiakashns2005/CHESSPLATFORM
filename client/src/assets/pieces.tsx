import React from 'react';
import { PieceType, PieceColor } from '../types/chess';

interface PieceProps {
  className?: string;
}

// Standard high-quality vector chess pieces (cburnett standard)
export const WhitePawn: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
      fill="#ffffff"
      stroke="#1a1a1a"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BlackPawn: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
      fill="#262421"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WhiteKnight: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" fillRule="evenodd" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 Z" />
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#1a1a1a" />
      <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#1a1a1a" />
    </g>
  </svg>
);

export const BlackKnight: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="#262421" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 Z" />
      <circle cx="9" cy="25" r="1" fill="#ffffff" stroke="none" />
      <path d="M 14.5 15.5 A 0.5 1.5 0 1 1 13.5,15.5 A 0.5 1.5 0 1 1 14.5 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#ffffff" stroke="none" />
    </g>
  </svg>
);

export const WhiteBishop: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <g fill="#ffffff" strokeLinecap="butt">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.14,39.5 35,40 C 32.61,39.53 25.89,40.47 22.5,39 C 19.11,40.47 12.39,39.53 10,40 C 7.86,39.5 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
      </g>
      <path d="M 17.5,26 L 27.5,26 C 27.5,26 28.5,25 27.5,24 C 26.5,23 25,23 25,23 C 25,20 27.5,18.5 27.5,15 C 27.5,11.5 25,8.5 22.5,8.5 C 20,8.5 17.5,11.5 17.5,15 C 17.5,18.5 20,20 20,23 C 20,23 18.5,23 17.5,24 C 16.5,25 17.5,26 17.5,26 z" fill="#ffffff" />
      <path d="M 20,12 L 25,12" />
      <path d="M 22.5,9.5 L 22.5,14.5" />
    </g>
  </svg>
);

export const BlackBishop: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <g fill="#262421" strokeLinecap="butt">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.14,39.5 35,40 C 32.61,39.53 25.89,40.47 22.5,39 C 19.11,40.47 12.39,39.53 10,40 C 7.86,39.5 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
      </g>
      <path d="M 17.5,26 L 27.5,26 C 27.5,26 28.5,25 27.5,24 C 26.5,23 25,23 25,23 C 25,20 27.5,18.5 27.5,15 C 27.5,11.5 25,8.5 22.5,8.5 C 20,8.5 17.5,11.5 17.5,15 C 17.5,18.5 20,20 20,23 C 20,23 18.5,23 17.5,24 C 16.5,25 17.5,26 17.5,26 z" fill="#262421" />
      <path d="M 20,12 L 25,12" stroke="#ffffff" />
      <path d="M 22.5,9.5 L 22.5,14.5" stroke="#ffffff" />
    </g>
  </svg>
);

export const WhiteRook: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" fillRule="evenodd" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
      <path d="M 11,14 L 34,14" />
      <path d="M 14,29.5 L 12,32 L 33,32 L 31,29.5" />
    </g>
  </svg>
);

export const BlackRook: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="#262421" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
      <path d="M 11,14 L 34,14" />
      <path d="M 14,29.5 L 12,32 L 33,32 L 31,29.5" />
    </g>
  </svg>
);

export const WhiteQueen: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" fillRule="evenodd" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 8 12 A 2 2 0 1 1 4,12 A 2 2 0 1 1 8 12 z" />
      <path d="M 17 9 A 2 2 0 1 1 13,9 A 2 2 0 1 1 17 9 z" />
      <path d="M 25 8 A 2 2 0 1 1 21,8 A 2 2 0 1 1 25 8 z" />
      <path d="M 33 9 A 2 2 0 1 1 29,9 A 2 2 0 1 1 33 9 z" />
      <path d="M 42 12 A 2 2 0 1 1 38,12 A 2 2 0 1 1 42 12 z" />
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z" />
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" />
      <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" />
    </g>
  </svg>
);

export const BlackQueen: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="#262421" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 8 12 A 2 2 0 1 1 4,12 A 2 2 0 1 1 8 12 z" />
      <path d="M 17 9 A 2 2 0 1 1 13,9 A 2 2 0 1 1 17 9 z" />
      <path d="M 25 8 A 2 2 0 1 1 21,8 A 2 2 0 1 1 25 8 z" />
      <path d="M 33 9 A 2 2 0 1 1 29,9 A 2 2 0 1 1 33 9 z" />
      <path d="M 42 12 A 2 2 0 1 1 38,12 A 2 2 0 1 1 42 12 z" />
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z" />
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" stroke="#ffffff" />
      <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke="#ffffff" />
    </g>
  </svg>
);

export const WhiteKing: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" />
      <path d="M 20,8 L 25,8" />
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="#ffffff" />
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,35 37.5,32 37.5,29 C 37.5,22 30,17.5 22.5,17.5 C 15,17.5 7.5,22 7.5,29 C 7.5,32 8.5,35 11.5,37 z" fill="#ffffff" />
      <path d="M 11.5,30 C 17,27 28,27 33.5,30" />
      <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" />
      <path d="M 11.5,37 C 17,34 28,34 33.5,37" />
    </g>
  </svg>
);

export const BlackKing: React.FC<PieceProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" stroke="#ffffff" />
      <path d="M 20,8 L 25,8" stroke="#ffffff" />
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="#262421" />
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,35 37.5,32 37.5,29 C 37.5,22 30,17.5 22.5,17.5 C 15,17.5 7.5,22 7.5,29 C 7.5,32 8.5,35 11.5,37 z" fill="#262421" />
      <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke="#ffffff" />
      <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" stroke="#ffffff" />
      <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke="#ffffff" />
    </g>
  </svg>
);

export const renderPiece = (type: PieceType, color: PieceColor, className?: string) => {
  const isWhite = color === 'w';
  switch (type) {
    case 'p':
      return isWhite ? <WhitePawn className={className} /> : <BlackPawn className={className} />;
    case 'n':
      return isWhite ? <WhiteKnight className={className} /> : <BlackKnight className={className} />;
    case 'b':
      return isWhite ? <WhiteBishop className={className} /> : <BlackBishop className={className} />;
    case 'r':
      return isWhite ? <WhiteRook className={className} /> : <BlackRook className={className} />;
    case 'q':
      return isWhite ? <WhiteQueen className={className} /> : <BlackQueen className={className} />;
    case 'k':
      return isWhite ? <WhiteKing className={className} /> : <BlackKing className={className} />;
    default:
      return null;
  }
};
