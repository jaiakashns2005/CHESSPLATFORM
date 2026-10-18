import { Chess, Square } from 'chess.js';
import { ChessPuzzle, PuzzleDifficulty } from '../../types/puzzle';

export const PUZZLES: ChessPuzzle[] = [
  {
    id: 'easy-back-rank-mate',
    title: 'Queen and king mate',
    theme: 'Checkmate in one',
    difficulty: 'easy',
    fen: '7k/6pp/5KQ1/8/8/8/8/8 w - - 0 1',
    playerColor: 'w',
    solutionUci: ['g6g7'],
    hint: 'The black king is boxed in by its own pawns. Look for a forcing queen capture.',
    explanation: 'Qxg7 is mate: the king protects the queen, and the black king has no escape square.',
    timeLimitSeconds: 90,
  },
  {
    id: 'easy-mirrored-queen-mate',
    title: 'Queen and king mate',
    theme: 'Checkmate in one',
    difficulty: 'easy',
    fen: '8/8/8/8/8/1qk5/PP6/K7 b - - 0 1',
    playerColor: 'b',
    solutionUci: ['b3b2'],
    hint: 'The white king is trapped by its own pawns. Find the protected queen capture.',
    explanation: 'Qxb2 is mate: the black king protects the queen and every escape square is covered.',
    timeLimitSeconds: 90,
  },
  {
    id: 'medium-rook-mate',
    title: 'Rook on the eighth rank',
    theme: 'Checkmate in one',
    difficulty: 'medium',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    playerColor: 'w',
    solutionUci: ['d1d8'],
    hint: 'The rook has a clear file to the back rank. Check every king escape square.',
    explanation: 'Rd8 is mate. The rook checks along the eighth rank and covers every escape square.',
    timeLimitSeconds: 75,
  },
  {
    id: 'medium-mirrored-rook-mate',
    title: 'Rook on the first rank',
    theme: 'Checkmate in one',
    difficulty: 'medium',
    fen: '1k2r3/8/8/8/8/8/PPP5/1K6 b - - 0 1',
    playerColor: 'b',
    solutionUci: ['e8e1'],
    hint: 'The rook can enter the back rank with check. Count the king’s safe squares.',
    explanation: 'Re1 is mate. The rook checks across the rank and the king has no legal escape.',
    timeLimitSeconds: 75,
  },
  {
    id: 'hard-queen-capture',
    title: 'Win the exposed queen',
    theme: 'Loose piece and tempo',
    difficulty: 'hard',
    fen: '4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1',
    playerColor: 'w',
    solutionUci: ['d2d5', 'e8e7'],
    hint: 'A long-range piece is undefended. Find a capture that also keeps your rook safe.',
    explanation: 'Rxd5 wins the queen. The king steps away automatically to continue the line.',
    timeLimitSeconds: 60,
  },
  {
    id: 'hard-mirrored-queen-capture',
    title: 'Take the loose queen',
    theme: 'Loose piece and tempo',
    difficulty: 'hard',
    fen: '3k4/4r3/8/8/4Q3/8/8/3K4 b - - 0 1',
    playerColor: 'b',
    solutionUci: ['e7e4', 'd1c1'],
    hint: 'Your rook has a clear file to a valuable target. Calculate the capture and king reply.',
    explanation: 'Rxe4 wins the queen. White’s king moves automatically to continue the line.',
    timeLimitSeconds: 60,
  },
];

export const PUZZLE_DIFFICULTIES: PuzzleDifficulty[] = ['easy', 'medium', 'hard'];
export const PUZZLE_THEMES = [
  'Checkmate', 'Fork', 'Pin', 'Skewer', 'Discovered Attack', 'Double Attack',
  'Winning Material', 'Sacrifice', 'Defensive Tactics',
] as const;
export const getPuzzleSearchDepth = (difficulty: PuzzleDifficulty): number =>
  difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;

export const validatePuzzle = (puzzle: ChessPuzzle): boolean => {
  try {
    const chess = new Chess(puzzle.fen);
    if (chess.turn() !== puzzle.playerColor || puzzle.solutionUci.length === 0) return false;
    for (const uci of puzzle.solutionUci) {
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return false;
      const move = chess.move({
        from: uci.slice(0, 2) as Square,
        to: uci.slice(2, 4) as Square,
        promotion: uci[4],
      });
      if (!move) return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const getPuzzleByDifficulty = (difficulty: PuzzleDifficulty): ChessPuzzle[] =>
  PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty && validatePuzzle(puzzle));

export const getPuzzlePositionKey = (puzzle: Pick<ChessPuzzle, 'fen'>): string =>
  puzzle.fen.split(' ').slice(0, 4).join(' ');

export const selectUnseenPuzzle = (puzzles: ChessPuzzle[], seen: ReadonlySet<string>): ChessPuzzle | null =>
  puzzles.find((puzzle) => !seen.has(getPuzzlePositionKey(puzzle)) && validatePuzzle(puzzle)) || null;

export const validateEnginePuzzle = (puzzle: ChessPuzzle, engineBestMove: string | null): boolean =>
  engineBestMove !== null && puzzle.solutionUci[0] === engineBestMove && validatePuzzle(puzzle);

export interface PuzzleCandidate {
  fen: string;
  playerColor: ChessPuzzle['playerColor'];
}

export const createPuzzleCandidate = (random: () => number = Math.random): PuzzleCandidate => {
  const chess = new Chess();
  const targetPly = 10 + Math.floor(random() * 39);
  for (let ply = 0; ply < targetPly && !chess.isGameOver(); ply += 1) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) break;
    chess.move(moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))]);
  }
  return { fen: chess.fen(), playerColor: chess.turn() };
};

const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 } as const;
const slidingDirections = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

const findKingSquare = (chess: Chess, color: 'w' | 'b'): Square | null => {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const square = `${'abcdefgh'[file]}${8 - rank}` as Square;
      const piece = chess.get(square);
      if (piece?.type === 'k' && piece.color === color) return square;
    }
  }
  return null;
};

const getNewlyAttackedMaterial = (before: Chess, after: Chess, attacker: 'w' | 'b', defender: 'w' | 'b') =>
  after.board().flatMap((rank, rankIndex) => rank.flatMap((piece, fileIndex) => {
    if (!piece || piece.color !== defender || piece.type === 'p' || piece.type === 'k') return [];
    const square = `${'abcdefgh'[fileIndex]}${8 - rankIndex}` as Square;
    return after.isAttacked(square, attacker) && !before.isAttacked(square, attacker) ? [{ square, piece }] : [];
  }));

const getPinnedSquares = (chess: Chess, attacker: 'w' | 'b', defender: 'w' | 'b'): Set<string> => {
  const kingSquare = findKingSquare(chess, defender);
  const pinned = new Set<string>();
  if (!kingSquare) return pinned;
  const kingFile = kingSquare.charCodeAt(0) - 97;
  const kingRank = Number(kingSquare[1]) - 1;

  for (const [fileStep, rankStep] of slidingDirections) {
    let possiblePin: Square | null = null;
    for (let distance = 1; distance < 8; distance += 1) {
      const file = kingFile + fileStep * distance;
      const rank = kingRank + rankStep * distance;
      if (file < 0 || file > 7 || rank < 0 || rank > 7) break;
      const square = `${'abcdefgh'[file]}${rank + 1}` as Square;
      const piece = chess.get(square);
      if (!piece) continue;
      if (!possiblePin) {
        if (piece.color !== defender) break;
        possiblePin = square;
        continue;
      }
      const diagonal = fileStep !== 0 && rankStep !== 0;
      const isCompatibleSlider = piece.type === 'q' || (diagonal ? piece.type === 'b' : piece.type === 'r');
      if (piece.color === attacker && isCompatibleSlider) pinned.add(possiblePin);
      break;
    }
  }
  return pinned;
};

const createsSkewer = (chess: Chess, from: Square, defender: 'w' | 'b'): boolean => {
  const slider = chess.get(from);
  if (!slider || !['b', 'r', 'q'].includes(slider.type)) return false;
  const startFile = from.charCodeAt(0) - 97;
  const startRank = Number(from[1]) - 1;

  for (const [fileStep, rankStep] of slidingDirections) {
    const diagonal = fileStep !== 0 && rankStep !== 0;
    if ((diagonal && slider.type === 'r') || (!diagonal && slider.type === 'b')) continue;
    let firstTarget: { type: keyof typeof pieceValues; value: number } | null = null;
    for (let distance = 1; distance < 8; distance += 1) {
      const file = startFile + fileStep * distance;
      const rank = startRank + rankStep * distance;
      if (file < 0 || file > 7 || rank < 0 || rank > 7) break;
      const piece = chess.get(`${'abcdefgh'[file]}${rank + 1}` as Square);
      if (!piece) continue;
      if (piece.color !== defender) break;
      if (!firstTarget) {
        firstTarget = { type: piece.type, value: pieceValues[piece.type] };
      } else {
        if (firstTarget.value > pieceValues[piece.type] && firstTarget.type !== 'p') return true;
        break;
      }
    }
  }
  return false;
};

export const createEnginePuzzle = (
  candidate: PuzzleCandidate,
  difficulty: PuzzleDifficulty,
  engineBestMove: string | null,
): ChessPuzzle | null => {
  if (!engineBestMove) return null;
  try {
    const before = new Chess(candidate.fen);
    const wasInCheck = before.inCheck();
    const chess = new Chess(candidate.fen);
    const move = chess.move({
      from: engineBestMove.slice(0, 2) as Square,
      to: engineBestMove.slice(2, 4) as Square,
      promotion: engineBestMove[4],
    });
    if (!move) return null;

    const isCheckmate = chess.isCheckmate();
    const opponentColor = candidate.playerColor === 'w' ? 'b' : 'w';
    const attackedTargets = getNewlyAttackedMaterial(before, chess, candidate.playerColor, opponentColor);
    const opponentKing = findKingSquare(chess, opponentColor);
    let isDiscoveredAttack = false;
    if (chess.inCheck() && opponentKing) {
      const withoutMovedPiece = new Chess(chess.fen());
      withoutMovedPiece.remove(move.to);
      isDiscoveredAttack = withoutMovedPiece.isAttacked(opponentKing, candidate.playerColor);
    }
    const isFork = chess.inCheck() && attackedTargets.length > 0;
    const isDoubleAttack = attackedTargets.length >= 2;
    const beforePins = getPinnedSquares(before, candidate.playerColor, opponentColor);
    const afterPins = getPinnedSquares(chess, candidate.playerColor, opponentColor);
    const createsPin = [...afterPins].some((square) => !beforePins.has(square));
    const createsSacrifice = !move.isCapture() && move.piece !== 'k' && chess.isAttacked(move.to, opponentColor);

    let theme: string | null = null;
    if (isCheckmate) theme = 'Checkmate';
    else if (isDiscoveredAttack) theme = 'Discovered Attack';
    else if (isFork) theme = 'Fork';
    else if (createsSkewer(chess, move.to, opponentColor)) theme = 'Skewer';
    else if (createsPin) theme = 'Pin';
    else if (isDoubleAttack) theme = 'Double Attack';
    else if (createsSacrifice) theme = 'Sacrifice';
    else if (wasInCheck) theme = 'Defensive Tactics';
    else if (move.isCapture()) theme = 'Winning Material';
    if (!theme) return null;

    const puzzle: ChessPuzzle = {
      id: `${getPuzzlePositionKey(candidate)}:${engineBestMove}`,
      title: `Find the ${theme.toLowerCase()} tactic`,
      theme,
      difficulty,
      fen: candidate.fen,
      playerColor: candidate.playerColor,
      solutionUci: [engineBestMove],
      hint: 'Calculate forcing moves first. Stockfish selected the best move in this position.',
      explanation: `${move.san} is Stockfish’s top move at the selected analysis depth.`,
      timeLimitSeconds: difficulty === 'easy' ? 90 : difficulty === 'medium' ? 75 : 60,
    };
    return validateEnginePuzzle(puzzle, engineBestMove) ? puzzle : null;
  } catch {
    return null;
  }
};