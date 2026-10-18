import { ChessSquare } from './chess';

export type EngineStatus = 'uninitialized' | 'loading' | 'ready' | 'analyzing' | 'error';

export interface EngineEvaluation {
  multipv: number;
  depth: number;
  seldepth?: number;
  scoreCp?: number; // Centipawns from White's perspective (+ = White advantage, - = Black advantage)
  scoreMate?: number; // Moves to mate from White's perspective (+ = White mates, - = Black mates)
  scoreDisplay: string; // Formatted score: e.g. "+1.4", "-0.7", "+M3", "-M2", "0.0"
  nodes?: number;
  nps?: number;
  timeMs?: number;
  pvUci: string[]; // UCI format move list (e.g. ["e2e4", "e7e5", "g1f3"])
  pvSan: string[]; // SAN format move list (e.g. ["e4", "e5", "Nf3"])
  bestMoveUci?: string;
  bestMoveSan?: string;
  bestMoveFrom?: ChessSquare;
  bestMoveTo?: ChessSquare;
}

export interface EngineSettings {
  enabled: boolean;
  depth: number;
  multiPv: number;
  threads: number;
  hashSizeMb: number;
}

export interface EngineAnalysisState {
  status: EngineStatus;
  isAnalyzing: boolean;
  error?: string;
  lines: EngineEvaluation[];
  bestMoveSan?: string;
  bestMoveUci?: string;
  bestMoveFrom?: ChessSquare;
  bestMoveTo?: ChessSquare;
  currentFen: string;
  depth: number;
}

export type MoveClassification =
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'forced';

export interface MoveQualityData {
  classification: MoveClassification;
  playedMoveSan: string;
  playedMoveUci: string;
  bestMoveSan: string;
  bestMoveUci: string;
  centipawnLoss: number;
  scoreBeforeCp: number;
  scoreAfterCp: number;
}
