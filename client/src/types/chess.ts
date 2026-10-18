import { PieceSymbol, Color, Square } from 'chess.js';

export type PieceType = PieceSymbol;
export type PieceColor = Color;
export type ChessSquare = Square;

export interface PieceInfo {
  type: PieceType;
  color: PieceColor;
  square: ChessSquare;
}

export interface MoveHistoryItem {
  id: string;
  san: string;
  from: ChessSquare;
  to: ChessSquare;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  fen: string;
  moveNumber: number;
  isCheck: boolean;
  isCheckmate: boolean;
  timestamp: number;
  whiteTimeRemainingMs?: number;
  blackTimeRemainingMs?: number;
}

export type GameOverReason =
  | 'checkmate'
  | 'stalemate'
  | 'threefold_repetition'
  | 'fifty_move_rule'
  | 'insufficient_material'
  | 'resignation'
  | 'timeout'
  | 'timeout_insufficient_material'
  | 'agreement'
  | null;

export interface GameResult {
  winner: PieceColor | 'draw' | null;
  reason: GameOverReason;
  message: string;
}

export interface MaterialBalance {
  score: number; // Positive = White ahead, Negative = Black ahead
  advantageColor: PieceColor | null;
  advantageDiff: number;
  whiteCaptured: PieceType[]; // Pieces captured by White (black's lost pieces)
  blackCaptured: PieceType[]; // Pieces captured by Black (white's lost pieces)
}

export type GameMode =
  | 'local-2p'
  | 'practice'
  | 'analysis'
  | 'vs-computer'
  | 'online';

export type BoardOrientation = 'white' | 'black';

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
  highlightLight: string;
  highlightDark: string;
  accent: string;
}

export interface MoveOption {
  from: ChessSquare;
  to: ChessSquare;
  promotion?: PieceType;
  san?: string;
  captured?: boolean;
}

export interface PendingPromotion {
  from: ChessSquare;
  to: ChessSquare;
  color: PieceColor;
}

// Time Control & Clock Types
export type TimeControlCategory =
  | 'bullet'
  | 'blitz'
  | 'rapid'
  | 'classical'
  | 'custom'
  | 'unlimited';

export interface TimeControl {
  id: string;
  name: string;
  category: TimeControlCategory;
  initialMinutes: number;
  incrementSeconds: number;
  isUnlimited?: boolean;
}

export interface ClockState {
  whiteTimeMs: number;
  blackTimeMs: number;
  isRunning: boolean;
  activeColor: PieceColor | null;
}

export interface DrawOfferState {
  isOffered: boolean;
  offeredBy: PieceColor | null;
}

export interface PGNMetadata {
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white?: string;
  black?: string;
  result?: string;
  whiteElo?: string;
  blackElo?: string;
  timeControl?: string;
  fen?: string;
  setup?: string;
}
