import { Chess, Move } from 'chess.js';
import { OpeningLine, OpeningPly } from '../../types/opening';
import { STARTING_FEN } from '../../utils/chessUtils';

export const OPENING_REPERTOIRE: OpeningLine[] = [
  {
    id: 'italian-giuoco-piano',
    name: 'Italian Game',
    family: 'Open Game',
    variation: 'Giuoco Piano',
    movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
    description: 'A classical open game. White develops rapidly toward the f7-square while Black mirrors development.',
    practiceColor: 'w',
  },
  {
    id: 'italian-two-knights',
    name: 'Italian Game',
    family: 'Open Game',
    variation: 'Two Knights Defense',
    movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'],
    description: 'Black develops with tempo against e4 and invites sharp central play.',
    practiceColor: 'b',
  },
  {
    id: 'ruy-lopez-morphy',
    name: 'Ruy Lopez',
    family: 'Open Game',
    variation: 'Morphy Defense',
    movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
    description: 'A mainline Spanish opening: Black questions the bishop and both sides prepare for the center.',
    practiceColor: 'w',
  },
  {
    id: 'sicilian-open',
    name: 'Sicilian Defense',
    family: 'Semi-Open Game',
    variation: 'Open Sicilian',
    movesSan: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3'],
    description: 'Black contests d4 asymmetrically, leading to dynamic positions with chances for both sides.',
    practiceColor: 'w',
  },
  {
    id: 'sicilian-najdorf',
    name: 'Sicilian Defense',
    family: 'Semi-Open Game',
    variation: 'Najdorf Variation',
    movesSan: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    description: 'The Najdorf prepares ...e5 or ...e6 while controlling b5 and keeping Black’s setup flexible.',
    practiceColor: 'b',
  },
  {
    id: 'french-advance',
    name: 'French Defense',
    family: 'Semi-Open Game',
    variation: 'Advance Variation',
    movesSan: ['e4', 'e6', 'd4', 'd5', 'e5'],
    description: 'White gains space; Black challenges the pawn chain with ...c5 and pressure on d4.',
    practiceColor: 'w',
  },
  {
    id: 'french-classical',
    name: 'French Defense',
    family: 'Semi-Open Game',
    variation: 'Classical Variation',
    movesSan: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'],
    description: 'Black develops quickly against e4 while maintaining the characteristic French pawn structure.',
    practiceColor: 'b',
  },
  {
    id: 'caro-kann-classical',
    name: 'Caro-Kann Defense',
    family: 'Semi-Open Game',
    variation: 'Classical Variation',
    movesSan: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
    description: 'Black develops the light-squared bishop outside the pawn chain before consolidating.',
    practiceColor: 'w',
  },
  {
    id: 'queens-gambit-declined',
    name: 'Queen’s Gambit',
    family: 'Closed Game',
    variation: 'Queen’s Gambit Declined',
    movesSan: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'],
    description: 'Black reinforces d5 and accepts a solid, strategically rich struggle for the center.',
    practiceColor: 'b',
  },
  {
    id: 'london-system',
    name: 'London System',
    family: 'Closed Game',
    variation: 'Classical Setup',
    movesSan: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5'],
    description: 'White develops the dark-squared bishop early and builds a reliable central setup.',
    practiceColor: 'w',
  },
  {
    id: 'kings-indian-classical',
    name: 'King’s Indian Defense',
    family: 'Indian Defense',
    variation: 'Classical Setup',
    movesSan: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'],
    description: 'Black fianchettoes the bishop and prepares a flexible counterattack against White’s center.',
    practiceColor: 'b',
  },
];

export const replayOpening = (line: OpeningLine, initialFen: string = STARTING_FEN): OpeningPly[] => {
  const chess = new Chess(initialFen);
  return line.movesSan.map((san) => {
    const move = chess.move(san) as Move;
    return {
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion || ''}`,
      from: move.from,
      to: move.to,
      color: move.color,
      moveNumber: Math.ceil(chess.history().length / 2),
      fenAfter: chess.fen(),
    };
  });
};

export const validateOpeningLine = (line: OpeningLine): boolean => {
  try {
    if (!line.movesSan.length) return false;
    return replayOpening(line).length === line.movesSan.length;
  } catch {
    return false;
  }
};