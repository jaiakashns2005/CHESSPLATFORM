import { Chess } from 'chess.js';
import { PositionEditorState } from '../types/analysis';
import { ChessSquare, PieceColor, PieceType } from '../types/chess';
import { STARTING_FEN } from '../utils/chessUtils';

export interface PositionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fen: string;
}

export const generateFENFromEditorState = (state: PositionEditorState): string => {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const fenRanks: string[] = [];

  for (const rank of ranks) {
    let emptyCount = 0;
    let rankStr = '';

    for (const file of files) {
      const square = `${file}${rank}` as ChessSquare;
      const piece = state.pieces[square];

      if (piece) {
        if (emptyCount > 0) {
          rankStr += emptyCount;
          emptyCount = 0;
        }
        const char = piece.type;
        rankStr += piece.color === 'w' ? char.toUpperCase() : char.toLowerCase();
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      rankStr += emptyCount;
    }
    fenRanks.push(rankStr);
  }

  const piecePlacement = fenRanks.join('/');
  const activeColor = state.turn;

  // Castling
  let castlingStr = '';
  if (state.castling.whiteKingside) castlingStr += 'K';
  if (state.castling.whiteQueenside) castlingStr += 'Q';
  if (state.castling.blackKingside) castlingStr += 'k';
  if (state.castling.blackQueenside) castlingStr += 'q';
  if (!castlingStr) castlingStr = '-';

  const enPassant = state.enPassantSquare || '-';
  const halfmove = state.halfmoveClock || 0;
  const fullmove = state.fullmoveNumber || 1;

  return `${piecePlacement} ${activeColor} ${castlingStr} ${enPassant} ${halfmove} ${fullmove}`;
};

export const parseFENToEditorState = (fen: string = STARTING_FEN): PositionEditorState => {
  const pieces: Partial<Record<ChessSquare, { type: PieceType; color: PieceColor }>> = {};
  const trimmed = fen.trim();
  const parts = trimmed.split(/\s+/);

  const piecePlacement = parts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const activeColor = (parts[1] as PieceColor) || 'w';
  const castlingStr = parts[2] || 'KQkq';
  const enPassant = (parts[3] as ChessSquare | '-') || '-';
  const halfmove = parseInt(parts[4] || '0', 10);
  const fullmove = parseInt(parts[5] || '1', 10);

  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const fenRanks = piecePlacement.split('/');

  fenRanks.forEach((rankStr, rankIdx) => {
    const rank = ranks[rankIdx];
    let fileIdx = 0;

    for (const char of rankStr) {
      if (char >= '1' && char <= '8') {
        fileIdx += parseInt(char, 10);
      } else {
        const file = files[fileIdx];
        if (file && rank) {
          const square = `${file}${rank}` as ChessSquare;
          const isWhite = char === char.toUpperCase();
          const type = char.toLowerCase() as PieceType;
          pieces[square] = { type, color: isWhite ? 'w' : 'b' };
        }
        fileIdx++;
      }
    }
  });

  return {
    pieces,
    turn: activeColor,
    castling: {
      whiteKingside: castlingStr.includes('K'),
      whiteQueenside: castlingStr.includes('Q'),
      blackKingside: castlingStr.includes('k'),
      blackQueenside: castlingStr.includes('q'),
    },
    enPassantSquare: enPassant,
    halfmoveClock: isNaN(halfmove) ? 0 : halfmove,
    fullmoveNumber: isNaN(fullmove) ? 1 : fullmove,
    selectedPalettePiece: null,
  };
};

/**
 * Validates a board setup according to FIDE rules
 */
export const validatePositionEditorState = (state: PositionEditorState): PositionValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  let whiteKings = 0;
  let blackKings = 0;
  let whitePawns = 0;
  let blackPawns = 0;
  let whiteTotal = 0;
  let blackTotal = 0;

  let whiteKingSquare: ChessSquare | null = null;
  let blackKingSquare: ChessSquare | null = null;

  for (const [sq, piece] of Object.entries(state.pieces)) {
    if (!piece) continue;
    const square = sq as ChessSquare;
    const rank = square[1];

    if (piece.color === 'w') {
      whiteTotal++;
      if (piece.type === 'k') {
        whiteKings++;
        whiteKingSquare = square;
      }
      if (piece.type === 'p') {
        whitePawns++;
        if (rank === '1' || rank === '8') {
          errors.push(`White pawn cannot be placed on the back ranks (${square}).`);
        }
      }
    } else {
      blackTotal++;
      if (piece.type === 'k') {
        blackKings++;
        blackKingSquare = square;
      }
      if (piece.type === 'p') {
        blackPawns++;
        if (rank === '1' || rank === '8') {
          errors.push(`Black pawn cannot be placed on the back ranks (${square}).`);
        }
      }
    }
  }

  // 1. King Count
  if (whiteKings === 0) errors.push('Position requires exactly one White King.');
  if (whiteKings > 1) errors.push(`Position has ${whiteKings} White Kings (maximum 1).`);
  if (blackKings === 0) errors.push('Position requires exactly one Black King.');
  if (blackKings > 1) errors.push(`Position has ${blackKings} Black Kings (maximum 1).`);

  // 2. Maximum Pieces
  if (whiteTotal > 16) warnings.push(`White has ${whiteTotal} pieces (standard maximum is 16).`);
  if (blackTotal > 16) warnings.push(`Black has ${blackTotal} pieces (standard maximum is 16).`);
  if (whitePawns > 8) warnings.push(`White has ${whitePawns} pawns (standard maximum is 8).`);
  if (blackPawns > 8) warnings.push(`Black has ${blackPawns} pawns (standard maximum is 8).`);

  // 3. Kings Adjacent Check
  if (whiteKingSquare && blackKingSquare) {
    const fileDiff = Math.abs(whiteKingSquare.charCodeAt(0) - blackKingSquare.charCodeAt(0));
    const rankDiff = Math.abs(parseInt(whiteKingSquare[1], 10) - parseInt(blackKingSquare[1], 10));
    if (fileDiff <= 1 && rankDiff <= 1) {
      errors.push('Kings cannot be on adjacent squares.');
    }
  }

  // 4. Castling Rights Verification
  if (state.castling.whiteKingside || state.castling.whiteQueenside) {
    if (!state.pieces['e1'] || state.pieces['e1']?.type !== 'k' || state.pieces['e1']?.color !== 'w') {
      errors.push('White castling is enabled, but White King is not on e1.');
    }
    if (state.castling.whiteKingside && (!state.pieces['h1'] || state.pieces['h1']?.type !== 'r' || state.pieces['h1']?.color !== 'w')) {
      errors.push('White kingside castling is enabled, but White Rook is not on h1.');
    }
    if (state.castling.whiteQueenside && (!state.pieces['a1'] || state.pieces['a1']?.type !== 'r' || state.pieces['a1']?.color !== 'w')) {
      errors.push('White queenside castling is enabled, but White Rook is not on a1.');
    }
  }

  if (state.castling.blackKingside || state.castling.blackQueenside) {
    if (!state.pieces['e8'] || state.pieces['e8']?.type !== 'k' || state.pieces['e8']?.color !== 'b') {
      errors.push('Black castling is enabled, but Black King is not on e8.');
    }
    if (state.castling.blackKingside && (!state.pieces['h8'] || state.pieces['h8']?.type !== 'r' || state.pieces['h8']?.color !== 'b')) {
      errors.push('Black kingside castling is enabled, but Black Rook is not on h8.');
    }
    if (state.castling.blackQueenside && (!state.pieces['a8'] || state.pieces['a8']?.type !== 'r' || state.pieces['a8']?.color !== 'b')) {
      errors.push('Black queenside castling is enabled, but Black Rook is not on a8.');
    }
  }

  const fen = generateFENFromEditorState(state);

  // 5. Check if side NOT to move is in check
  if (whiteKings === 1 && blackKings === 1 && errors.length === 0) {
    try {
      // If it's White's turn, Black King must not be in check
      const opponentColor: PieceColor = state.turn === 'w' ? 'b' : 'w';
      const tempFenWithOpponentTurn = fen.replace(` ${state.turn} `, ` ${opponentColor} `);
      const tempChess = new Chess(tempFenWithOpponentTurn);
      if (tempChess.inCheck()) {
        errors.push(`The player not to move (${opponentColor === 'w' ? 'White' : 'Black'}) is in check, which is an impossible state.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid position notation.';
      errors.push(msg);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fen,
  };
};
