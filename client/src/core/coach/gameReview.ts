import { Chess, Move, Square } from 'chess.js';
import { MoveTreeNode } from '../../types/analysis';
import { STARTING_FEN } from '../../utils/chessUtils';

export interface ParsedCoachGame {
  initialFen: string;
  moves: MoveTreeNode[];
}

export const parseCoachGamePgn = (pgn: string): ParsedCoachGame => {
  const source = pgn.trim();
  if (!source) throw new Error('Paste a completed game in PGN format to review it.');
  const parsed = new Chess();
  try {
    parsed.loadPgn(source);
  } catch {
    throw new Error('This PGN could not be parsed. Check the move text and try again.');
  }
  const headers = parsed.getHeaders();
  const result = headers.Result;
  if (!parsed.isGameOver() && !['1-0', '0-1', '1/2-1/2'].includes(result || '')) {
    throw new Error('Review a completed game with a recorded result, rather than an unfinished game.');
  }
  const initialFen = headers.FEN || STARTING_FEN;
  const history = parsed.history({ verbose: true }) as Move[];
  if (history.length === 0) throw new Error('This PGN does not contain any moves to review.');

  const replay = new Chess(initialFen);
  const moves = history.map((move, index) => {
    const applied = replay.move({
      from: move.from as Square,
      to: move.to as Square,
      promotion: move.promotion,
    });
    if (!applied || applied.san !== move.san) throw new Error(`The PGN move at ply ${index + 1} is not legal from its recorded position.`);
    return {
      id: `coach-ply-${index + 1}`,
      san: applied.san,
      from: applied.from,
      to: applied.to,
      piece: applied.piece,
      color: applied.color,
      captured: applied.captured,
      promotion: applied.promotion,
      fen: replay.fen(),
      moveNumber: Math.floor(index / 2) + 1,
      isCheck: replay.inCheck(),
      isCheckmate: replay.isCheckmate(),
      comment: undefined,
      parentId: index === 0 ? 'root' : `coach-ply-${index}`,
      childrenIds: index === history.length - 1 ? [] : [`coach-ply-${index + 2}`],
      isMainline: true,
    } satisfies MoveTreeNode;
  });
  return { initialFen, moves };
};
