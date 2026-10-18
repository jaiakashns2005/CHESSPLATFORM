import { Chess, Move, Square } from 'chess.js';
import { EndgameCandidate, EndgameCategory, EndgameChallenge, EndgameSeed } from '../../types/endgame';
import { PuzzleDifficulty } from '../../types/puzzle';

export const ENDGAME_POSITION_BANK: EndgameSeed[] = [
  {
    id: 'king-pawn-v-king',
    category: 'King + Pawn vs King',
    title: 'Escort the passed pawn',
    fen: '8/8/8/2k5/3P4/8/8/2K5 w - - 0 1',
    hint: 'Coordinate your king and pawn. Calculate the opposing king’s route to the promotion square.',
    explanation: 'In king-and-pawn endings, king activity decides whether the passer can advance safely. Keep the king close enough to support the pawn.',
  },
  {
    id: 'queen-v-pawn',
    category: 'Queen vs Pawn',
    title: 'Stop the dangerous passer',
    fen: '8/8/4k3/8/3p4/8/4Q3/4K3 w - - 0 1',
    hint: 'The pawn is close to promotion. Look for a forcing queen move that controls its path.',
    explanation: 'Queen-versus-pawn endings are races: use checks and direct control of the promotion square before the pawn can advance.',
  },
  {
    id: 'rook-king-v-king',
    category: 'Rook + King vs King',
    title: 'Restrict the lone king',
    fen: '8/8/4k3/8/8/8/3R4/4K3 w - - 0 1',
    hint: 'Use the rook to cut off the enemy king, then bring your king closer.',
    explanation: 'A rook-and-king mate is built by restricting the king with the rook and advancing your king to support the final checking net.',
  },
  {
    id: 'rook-endgame',
    category: 'Rook Endgames',
    title: 'Activate the rook',
    fen: '8/5k2/6p1/8/4P3/8/5K2/4R1r1 w - - 0 1',
    hint: 'Compare king activity, passed pawns, and checks before choosing a rook move.',
    explanation: 'Rook endings reward active rooks. Checks, attacks from behind, and king activity often matter more than holding a pawn passively.',
  },
  {
    id: 'bishop-endgame',
    category: 'Bishop Endgames',
    title: 'Improve the bishop',
    fen: '8/5k2/6p1/8/4P3/2B2b2/5K2/8 w - - 0 1',
    hint: 'Find a bishop move that improves your king-and-pawn coordination without allowing a useful check.',
    explanation: 'Bishop endings depend on active diagonals and pawn color. Keep the bishop on useful lines while the king supports targets.',
  },
  {
    id: 'knight-endgame',
    category: 'Knight Endgames',
    title: 'Bring the knight toward the center',
    fen: '8/5k2/6p1/8/4P3/2N2n2/5K2/8 w - - 0 1',
    hint: 'Knights need useful central squares. Look for a move that also protects your pawn structure.',
    explanation: 'Knight endings often resemble pawn endings: centralize the king and place the knight where it can attack targets and support passed pawns.',
  },
  {
    id: 'queen-endgame',
    category: 'Queen Endgames',
    title: 'Use forcing queen play',
    fen: '8/5k2/6p1/8/4P3/2Q2q2/5K2/8 w - - 0 1',
    hint: 'Calculate checks and queen exchanges carefully; king safety is unusually exposed in queen endings.',
    explanation: 'Queen endings are tactical. Check possibilities, perpetual-check risks, and king safety before committing to a pawn race.',
  },
  {
    id: 'basic-checkmate',
    category: 'Basic Checkmate',
    title: 'Finish with queen and king',
    fen: '7k/8/5KQ1/8/8/8/8/8 w - - 0 1',
    hint: 'The enemy king is trapped near the edge. Find the queen move that completes the mating net.',
    explanation: 'In queen-and-king versus king, use the queen to restrict the enemy king and let your king protect the mating squares.',
  },
  {
    id: 'pawn-promotion',
    category: 'Pawn Promotion',
    title: 'Promote with tempo',
    fen: '8/P7/2k5/8/8/8/8/4K3 w - - 0 1',
    hint: 'The pawn is one step from promotion. Check whether the opposing king can stop it.',
    explanation: 'A pawn on the seventh rank can be decisive, but calculate king opposition and promotion checks before advancing.',
  },
  {
    id: 'opposition',
    category: 'Opposition',
    title: 'Take the opposition',
    fen: '8/8/4k3/8/4K3/4P3/8/8 w - - 0 1',
    hint: 'The kings face each other with one square between them. Choose the move that preserves the opposition.',
    explanation: 'Direct opposition is a key king-and-pawn technique. The side not to move often owns the opposition and can force the other king aside.',
  },
  {
    id: 'zugzwang',
    category: 'Zugzwang',
    title: 'Improve the king’s waiting move',
    fen: '8/8/5k2/5p2/5K2/5P2/8/8 w - - 0 1',
    hint: 'Every pawn move changes the king’s access. Find the move that leaves your opponent without a useful reply.',
    explanation: 'Zugzwang occurs when every legal move worsens the position. Preserve the key squares and force the opposing king or pawn to yield.',
  },
  {
    id: 'king-pawn-technique',
    category: 'King and Pawn technique',
    title: 'Support the pawn from behind',
    fen: '8/8/8/8/4k3/4P3/4K3/8 w - - 0 1',
    hint: 'Bring the king into the pawn’s path while avoiding a direct king blockade.',
    explanation: 'The king is the most important piece in a pawn ending. Use it to gain opposition, escort the passer, and control promotion squares.',
  },
];

export const endgamePositionKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');

export const validateEndgameSeed = (seed: EndgameSeed): boolean => {
  try {
    const chess = new Chess(seed.fen);
    return chess.moves().length > 0 && Boolean(chess.get('a1') || chess.get('h8') || chess.board().flat().some(Boolean));
  } catch {
    return false;
  }
};

export const generateEndgameCandidate = (
  seenPositions: ReadonlySet<string>,
  random: () => number = Math.random,
  preferredCategory?: EndgameCategory,
): EndgameCandidate => {
  const pool = ENDGAME_POSITION_BANK.filter((seed) => !preferredCategory || seed.category === preferredCategory);
  if (pool.length === 0) throw new Error(`No endgame seed found for ${preferredCategory}.`);

  for (let attempt = 0; attempt < 2048; attempt += 1) {
    const seed = pool[Math.floor(random() * pool.length) % pool.length];
    const chess = new Chess(seed.fen);
    const targetPly = Math.floor(random() * 17);

    for (let ply = 0; ply < targetPly && !chess.isGameOver(); ply += 1) {
      const moves = (chess.moves({ verbose: true }) as Move[]).filter((move) => !move.isCapture() && !move.isPromotion());
      if (moves.length === 0) break;
      chess.move(moves[Math.floor(random() * moves.length) % moves.length]);
    }

    if (chess.isGameOver() || chess.moves().length === 0) continue;
    const fen = chess.fen();
    const key = endgamePositionKey(fen);
    if (!seenPositions.has(key)) return { ...seed, id: `${seed.id}:${key}`, fen };
  }

  throw new Error('Could not create an unseen legal endgame position.');
};

export const createEndgameChallenge = (
  candidate: EndgameCandidate,
  difficulty: PuzzleDifficulty,
  engineBestMove: string | null,
): EndgameChallenge | null => {
  if (!engineBestMove || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(engineBestMove)) return null;
  try {
    const chess = new Chess(candidate.fen);
    const move = chess.move({
      from: engineBestMove.slice(0, 2) as Square,
      to: engineBestMove.slice(2, 4) as Square,
      promotion: engineBestMove[4],
    });
    if (!move) return null;
    return {
      ...candidate,
      difficulty,
      playerColor: chess.turn() === 'w' ? 'b' : 'w',
      solutionUci: engineBestMove,
      solutionSan: move.san,
      explanation: candidate.explanation,
      timeLimitSeconds: difficulty === 'easy' ? 120 : difficulty === 'medium' ? 90 : 60,
    };
  } catch {
    return null;
  }
};

export const validateEndgameMove = (fen: string, expectedUci: string, playedUci: string): boolean => {
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: playedUci.slice(0, 2) as Square,
      to: playedUci.slice(2, 4) as Square,
      promotion: playedUci[4],
    });
    return Boolean(move) && playedUci === expectedUci;
  } catch {
    return false;
  }
};
