import { Chess, Square, Move } from 'chess.js';
import { PieceType, PieceColor, MaterialBalance, BoardTheme, MoveHistoryItem, PGNMetadata, ChessSquare } from '../types/chess';

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'green',
    name: 'Tournament Green',
    light: '#eeeed2',
    dark: '#769656',
    highlightLight: '#ceda76',
    highlightDark: '#a3b743',
    accent: '#81b64c',
  },
  {
    id: 'classic',
    name: 'Classic Wood',
    light: '#f0d9b5',
    dark: '#b58863',
    highlightLight: '#e4d38c',
    highlightDark: '#cbb06d',
    accent: '#b58863',
  },
  {
    id: 'dark',
    name: 'Charcoal Stealth',
    light: '#707070',
    dark: '#404040',
    highlightLight: '#9b9b9b',
    highlightDark: '#555555',
    accent: '#3b82f6',
  },
  {
    id: 'blue',
    name: 'Oceanic Blue',
    light: '#dee3e6',
    dark: '#8ca2ad',
    highlightLight: '#b5c9d5',
    highlightDark: '#758d9b',
    accent: '#0ea5e9',
  },
  {
    id: 'glass',
    name: 'Icy Glass',
    light: '#e2e8f0',
    dark: '#94a3b8',
    highlightLight: '#cbd5e1',
    highlightDark: '#64748b',
    accent: '#6366f1',
  }
];

export const isSquareLight = (square: Square): boolean => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1], 10) - 1;
  return (file + rank) % 2 !== 0;
};

export const calculateMaterialBalance = (fen: string): MaterialBalance => {
  const startingPieces: Record<PieceColor, Record<PieceType, number>> = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  };

  const currentPieces: Record<PieceColor, Record<PieceType, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  const boardPart = fen.split(' ')[0];
  for (const char of boardPart) {
    if (char === '/' || (char >= '1' && char <= '8')) continue;
    const isWhite = char === char.toUpperCase();
    const color: PieceColor = isWhite ? 'w' : 'b';
    const type = char.toLowerCase() as PieceType;
    if (currentPieces[color][type] !== undefined) {
      currentPieces[color][type]++;
    }
  }

  // Calculate captured pieces
  const whiteCaptured: PieceType[] = [];
  const blackCaptured: PieceType[] = [];

  const pieceOrder: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

  for (const piece of pieceOrder) {
    // Pieces white captured are black pieces missing
    const blackLost = Math.max(0, startingPieces.b[piece] - currentPieces.b[piece]);
    for (let i = 0; i < blackLost; i++) {
      whiteCaptured.push(piece);
    }

    // Pieces black captured are white pieces missing
    const whiteLost = Math.max(0, startingPieces.w[piece] - currentPieces.w[piece]);
    for (let i = 0; i < whiteLost; i++) {
      blackCaptured.push(piece);
    }
  }

  let whitePoints = 0;
  let blackPoints = 0;

  for (const piece of pieceOrder) {
    whitePoints += currentPieces.w[piece] * PIECE_VALUES[piece];
    blackPoints += currentPieces.b[piece] * PIECE_VALUES[piece];
  }

  const score = whitePoints - blackPoints;
  const advantageColor: PieceColor | null = score > 0 ? 'w' : score < 0 ? 'b' : null;
  const advantageDiff = Math.abs(score);

  return {
    score,
    advantageColor,
    advantageDiff,
    whiteCaptured,
    blackCaptured,
  };
};

export const isValidFEN = (fen: string): { valid: boolean; error?: string } => {
  if (!fen || typeof fen !== 'string') {
    return { valid: false, error: 'Empty or invalid FEN string.' };
  }
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) {
    return { valid: false, error: 'FEN must contain all 6 fields (pieces, turn, castling, en passant, halfmove, fullmove).' };
  }
  try {
    const trimmed = fen.trim();
    const chess = new Chess();
    chess.load(trimmed);
    return { valid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid FEN notation.';
    return { valid: false, error: message };
  }
};

export const formatMoveSAN = (san: string): string => {
  return san.replace('x', '×').replace('#', '‡');
};

/**
 * Checks if a player has insufficient material to deliver checkmate on their own.
 * FIDE rule: If player A flags on time, but player B has insufficient material to mate, it's a draw.
 */
export const hasInsufficientMaterialToMate = (fen: string, color: PieceColor): boolean => {
  const pieces: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  const boardPart = fen.split(' ')[0];

  for (const char of boardPart) {
    if (char === '/' || (char >= '1' && char <= '8')) continue;
    const isWhite = char === char.toUpperCase();
    const pieceColor: PieceColor = isWhite ? 'w' : 'b';
    if (pieceColor === color) {
      const type = char.toLowerCase() as PieceType;
      pieces[type] = (pieces[type] || 0) + 1;
    }
  }

  // Any pawn, rook, or queen means mating material exists
  if (pieces.p > 0 || pieces.r > 0 || pieces.q > 0) {
    return false;
  }

  // King + 2 Bishops or Bishop + Knight can mate
  if (pieces.b >= 2 || (pieces.b >= 1 && pieces.n >= 1)) {
    return false;
  }

  // Lone King, King+Knight, King+Bishop cannot force mate against lone king
  if (pieces.b <= 1 && pieces.n <= 1) {
    return true;
  }

  return false;
};

export interface ParsedPGN {
  success: boolean;
  error?: string;
  metadata: PGNMetadata;
  history: MoveHistoryItem[];
  finalFen: string;
  initialFen: string;
  movesCount: number;
}

/**
 * Comprehensive PGN parser and validator
 */
export const parsePGN = (pgnString: string): ParsedPGN => {
  if (!pgnString || typeof pgnString !== 'string' || pgnString.trim().length === 0) {
    return {
      success: false,
      error: 'PGN input is empty.',
      metadata: {},
      history: [],
      finalFen: STARTING_FEN,
      initialFen: STARTING_FEN,
      movesCount: 0,
    };
  }

  try {
    const raw = pgnString.trim();
    const metadata: PGNMetadata = {};

    // 1. Extract Bracket Headers [Key "Value"]
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match;
    while ((match = headerRegex.exec(raw)) !== null) {
      const key = match[1].toLowerCase();
      const val = match[2];
      if (key === 'event') metadata.event = val;
      else if (key === 'site') metadata.site = val;
      else if (key === 'date') metadata.date = val;
      else if (key === 'round') metadata.round = val;
      else if (key === 'white') metadata.white = val;
      else if (key === 'black') metadata.black = val;
      else if (key === 'result') metadata.result = val;
      else if (key === 'whiteelo') metadata.whiteElo = val;
      else if (key === 'blackelo') metadata.blackElo = val;
      else if (key === 'timecontrol') metadata.timeControl = val;
      else if (key === 'fen') metadata.fen = val;
      else if (key === 'setup') metadata.setup = val;
    }

    // Determine starting position
    const initialFen = metadata.fen || STARTING_FEN;
    const testChess = new Chess(initialFen);

    // 2. Strip bracket headers and comments to isolate move text
    let moveSection = raw.replace(/\[.*?\]/g, '');
    // Strip comments {...} and ;...
    moveSection = moveSection.replace(/\{[^}]*\}/g, ' ');
    moveSection = moveSection.replace(/;[^\r\n]*/g, ' ');
    // Strip recursive annotations variations (...)
    moveSection = moveSection.replace(/\([^)]*\)/g, ' ');
    // Strip NAGs ($1, $2, etc.)
    moveSection = moveSection.replace(/\$\d+/g, ' ');
    // Strip result markers
    moveSection = moveSection.replace(/(1-0|0-1|1\/2-1\/2|\*)/g, ' ');

    // 3. Tokenize moves
    // Replace move numbers e.g. "1.", "12...", "1..." with space
    moveSection = moveSection.replace(/\d+\.{1,3}/g, ' ');

    const tokens = moveSection
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const history: MoveHistoryItem[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      try {
        const moveDetails = testChess.move(token) as Move;
        if (!moveDetails) {
          return {
            success: false,
            error: `Illegal or unrecognized move "${token}" at move #${Math.floor(i / 2) + 1}.`,
            metadata,
            history: [],
            finalFen: initialFen,
            initialFen,
            movesCount: 0,
          };
        }

        const isCheck = testChess.inCheck();
        const isCheckmate = testChess.isCheckmate();

        history.push({
          id: `${moveDetails.san}-${i}`,
          san: moveDetails.san,
          from: moveDetails.from as ChessSquare,
          to: moveDetails.to as ChessSquare,
          piece: moveDetails.piece,
          color: moveDetails.color,
          captured: moveDetails.captured,
          promotion: moveDetails.promotion,
          fen: testChess.fen(),
          moveNumber: Math.floor(i / 2) + 1,
          isCheck,
          isCheckmate,
          timestamp: Date.now(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          error: `Error playing move "${token}": ${message}`,
          metadata,
          history: [],
          finalFen: initialFen,
          initialFen,
          movesCount: 0,
        };
      }
    }

    return {
      success: true,
      metadata,
      history,
      finalFen: testChess.fen(),
      initialFen,
      movesCount: history.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse PGN.';
    return {
      success: false,
      error: message,
      metadata: {},
      history: [],
      finalFen: STARTING_FEN,
      initialFen: STARTING_FEN,
      movesCount: 0,
    };
  }
};

/**
 * Export PGN with complete Seven-Tag Roster headers
 */
export const buildPGN = (
  history: MoveHistoryItem[],
  metadata: PGNMetadata = {},
  initialFen: string = STARTING_FEN
): string => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  const headers: [string, string][] = [
    ['Event', metadata.event || 'Chess Training Platform Match'],
    ['Site', metadata.site || 'Local Platform'],
    ['Date', metadata.date || dateStr],
    ['Round', metadata.round || '1'],
    ['White', metadata.white || 'White Player'],
    ['Black', metadata.black || 'Black Player'],
    ['Result', metadata.result || '*'],
  ];

  if (metadata.whiteElo) headers.push(['WhiteElo', metadata.whiteElo]);
  if (metadata.blackElo) headers.push(['BlackElo', metadata.blackElo]);
  if (metadata.timeControl) headers.push(['TimeControl', metadata.timeControl]);

  if (initialFen !== STARTING_FEN) {
    headers.push(['SetUp', '1']);
    headers.push(['FEN', initialFen]);
  }

  let pgn = headers.map(([k, v]) => `[${k} "${v}"]`).join('\n') + '\n\n';

  // Construct SAN moves
  const moveStrings: string[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = history[i]?.san || '';
    const blackMove = history[i + 1]?.san || '';

    if (blackMove) {
      moveStrings.push(`${moveNum}. ${whiteMove} ${blackMove}`);
    } else if (whiteMove) {
      moveStrings.push(`${moveNum}. ${whiteMove}`);
    }
  }

  const resultStr = metadata.result || '*';
  pgn += (moveStrings.length > 0 ? moveStrings.join(' ') + ' ' : '') + resultStr;

  return pgn;
};

/**
 * Trigger client-side file download of PGN
 */
export const downloadPGNFile = (pgnContent: string, filename: string = 'game.pgn') => {
  const blob = new Blob([pgnContent], { type: 'application/x-chess-pgn;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
