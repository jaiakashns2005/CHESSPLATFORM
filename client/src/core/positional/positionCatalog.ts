import { Chess } from 'chess.js';
import { PositionalChallenge } from '../../types/positional';
import { STARTING_FEN } from '../../utils/chessUtils';

export const POSITIONAL_CHALLENGES: PositionalChallenge[] = [
  {
    id: 'king-safety-ruy',
    title: 'Keep the initiative without exposing your king',
    category: 'King Safety',
    difficulty: 'beginner',
    contextMovesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
    hint: 'Both sides have developed toward castling. Look for a move that maintains king shelter while bringing another piece into play.',
    deeperHint: 'Before advancing a flank pawn, consider a central move that keeps lines closed around your king.',
    explanation: 'King safety is strongest when development and central control work together. Avoid weakening the pawn cover without a concrete gain.',
  },
  {
    id: 'piece-activity-italian',
    title: 'Find an active square for your pieces',
    category: 'Piece Activity',
    difficulty: 'beginner',
    contextMovesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Bc5'],
    hint: 'Look for a developing move that improves a piece and supports the center at the same time.',
    deeperHint: 'Your queenside knight has not moved yet. Find a useful square that increases central influence.',
    explanation: 'Active pieces control central squares and create threats. Development is valuable when the piece reaches a useful square with a purpose.',
  },
  {
    id: 'weak-squares-french',
    title: 'Challenge the pawn chain at its base',
    category: 'Weak Squares',
    difficulty: 'intermediate',
    contextMovesSan: ['e4', 'e6', 'd4', 'd5', 'e5'],
    hint: 'The advanced pawn chain leaves squares behind it. Think about which pawn break can challenge its support.',
    deeperHint: 'A timely c-pawn advance can attack the base of White’s center and contest d4.',
    explanation: 'Weak squares often appear behind an advanced pawn chain. Challenging its base can create targets and useful entry squares.',
  },
  {
    id: 'outpost-sicilian',
    title: 'Secure a central outpost',
    category: 'Outposts',
    difficulty: 'intermediate',
    contextMovesSan: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    hint: 'Find a stable square in the center that your opponent cannot easily drive away with a pawn.',
    deeperHint: 'The e5 square is a natural outpost candidate. Prepare a piece to occupy it or support that advance.',
    explanation: 'An outpost is a protected square in enemy territory that opposing pawns cannot challenge. It can anchor a knight and restrict the opponent.',
  },
  {
    id: 'pawn-structure-caro',
    title: 'Choose a plan for the pawn structure',
    category: 'Pawn Structure',
    difficulty: 'intermediate',
    contextMovesSan: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
    hint: 'Consider which pawn exchanges have changed the center and where the resulting open lines point.',
    deeperHint: 'The central d-pawn has disappeared. Use development and central pressure before starting a wing attack.',
    explanation: 'Pawn exchanges define the position’s structure. Plans should use the open lines and avoid creating new weaknesses without a reason.',
  },
  {
    id: 'open-files-sicilian',
    title: 'Claim the half-open file',
    category: 'Open Files',
    difficulty: 'advanced',
    contextMovesSan: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'a6', 'Nc3', 'Qc7'],
    hint: 'A central pawn has left its file. Find a way to place a rook where it can pressure that file.',
    deeperHint: 'The c-file is half-open for Black. Connect the rooks and contest it before White consolidates.',
    explanation: 'Rooks are most effective on open and half-open files. Occupying the file first can create pressure against targets in the opponent’s camp.',
  },
  {
    id: 'open-diagonal-catalan',
    title: 'Unblock the long diagonal',
    category: 'Open Diagonals',
    difficulty: 'advanced',
    contextMovesSan: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O', 'O-O'],
    hint: 'The fianchetto bishop needs a clear diagonal. Look for a central break that opens its line.',
    deeperHint: 'An e-pawn advance can challenge the center and clear lines for the bishop on g2.',
    explanation: 'A bishop’s long diagonal is valuable when its own pawns do not block it. Central pawn breaks can open the line and increase its scope.',
  },
  {
    id: 'good-bad-pieces-french',
    title: 'Work around the restricted bishop',
    category: 'Good vs Bad Pieces',
    difficulty: 'advanced',
    contextMovesSan: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7'],
    hint: 'One bishop is hemmed in by its own central pawns. Find a plan that improves it or makes its role less important.',
    deeperHint: 'Consider preparing a pawn break that can exchange the blocked center and open the bishop’s diagonals.',
    explanation: 'A bad bishop is restricted by its own pawns. Improve it by changing the pawn structure, exchanging it, or giving it a useful defensive role.',
  },
  {
    id: 'space-kings-indian',
    title: 'Use your space advantage',
    category: 'Space',
    difficulty: 'beginner',
    contextMovesSan: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3', 'O-O', 'Be3'],
    hint: 'You have more room in the center. Improve coordination while keeping the opponent’s pieces short of useful squares.',
    deeperHint: 'A developing move that supports the center and prepares a safe king position can preserve the space advantage.',
    explanation: 'Space restricts opposing pieces, but it must be supported. Develop calmly and avoid creating targets that let the opponent break free.',
  },
  {
    id: 'worst-piece-london',
    title: 'Improve your least active piece',
    category: 'Improving the Worst-placed Piece',
    difficulty: 'advanced',
    contextMovesSan: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2'],
    hint: 'Compare your pieces. Which one has the fewest useful squares or influence?',
    deeperHint: 'The queenside knight has not developed. Find a route that brings it closer to the center without blocking your pieces.',
    explanation: 'Improving the worst-placed piece raises the activity of the whole army. A useful route connects the piece to central squares and future play.',
  },
];

export const getPositionalFen = (challenge: PositionalChallenge): string => {
  const chess = new Chess(STARTING_FEN);
  for (const san of challenge.contextMovesSan) chess.move(san);
  return chess.fen();
};

export const validatePositionalChallenge = (challenge: PositionalChallenge): boolean => {
  try {
    if (!challenge.contextMovesSan.length) return false;
    const chess = new Chess(STARTING_FEN);
    for (const san of challenge.contextMovesSan) {
      if (!chess.move(san)) return false;
    }
    return true;
  } catch {
    return false;
  }
};