import { Chess, Square } from 'chess.js';
import { EngineEvaluation, EngineSettings, EngineStatus } from '../../types/engine';
import { ChessSquare, PieceColor } from '../../types/chess';

export interface StockfishCallbacks {
  onStatusChange?: (status: EngineStatus) => void;
  onEvaluationUpdate?: (lines: EngineEvaluation[], depth: number, fen: string) => void;
  onBestMove?: (bestMoveUci: string, bestMoveSan: string, from: ChessSquare, to: ChessSquare, fen: string) => void;
  onSearchComplete?: (fen: string, bestMoveUci: string | null) => void;
  onError?: (error: string) => void;
}

interface PendingSearch {
  fen: string;
  depth: number;
  multiPv: number;
}

export class StockfishService {
  private worker: Worker | null = null;
  private status: EngineStatus = 'uninitialized';
  private callbacks: StockfishCallbacks = {};
  private currentFen: string = '';
  private currentTurn: PieceColor = 'w';
  private currentLines: Map<number, EngineEvaluation> = new Map();
  private isSearching: boolean = false;
  private isReady: boolean = false;
  private targetDepth: number = 15;
  private currentMultiPv: number = 2;
  private pendingSearch: PendingSearch | null = null;
  private initTimeout: ReturnType<typeof setTimeout> | null = null;
  private ignoreSearchOutput: boolean = false;

  constructor(callbacks: StockfishCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public getStatus(): EngineStatus {
    return this.status;
  }

  public isEngineSearching(): boolean {
    return this.isSearching;
  }

  public isEngineReady(): boolean {
    return this.isReady;
  }

  public init(): boolean {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      this.setStatus('error');
      if (this.callbacks.onError) {
        this.callbacks.onError('Web Workers are not supported in this browser environment.');
      }
      return false;
    }

    if (this.worker) {
      return true;
    }

    try {
      this.setStatus('loading');
      this.isReady = false;

      // Auto-detect WebAssembly support (modern browsers) with fallback to asm.js
      const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
      const workerUrl = new URL(hasWasm ? 'stockfish.wasm.js' : 'stockfish.js', document.baseURI).href;
      console.log(`[Stockfish] Creating Web Worker for ${workerUrl}...`);

      try {
        this.worker = new Worker(workerUrl);
      } catch (workerErr) {
        if (hasWasm) {
          console.warn('[Stockfish] WASM worker instantiation failed, falling back to /stockfish.js asm.js...', workerErr);
          this.worker = new Worker(new URL('stockfish.js', document.baseURI));
        } else {
          throw workerErr;
        }
      }

      // Set an initialization timeout (12 seconds)
      this.initTimeout = setTimeout(() => {
        if (!this.isReady) {
          console.warn('[Stockfish] Worker initialization timeout reached.');
          this.setStatus('error');
          if (this.callbacks.onError) {
            this.callbacks.onError('Stockfish engine timed out during initialization.');
          }
        }
      }, 12000);

      this.worker.onmessage = (event: MessageEvent) => {
        const raw = typeof event.data === 'string' ? event.data : '';
        // In Emscripten, stdout might arrive in chunks or multiple lines
        const lines = raw.split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            console.log('[Stockfish Output]', line.trim());
          }
          this.handleEngineOutput(line);
        }
      };

      this.worker.onmessageerror = (err) => {
        console.error('[Stockfish] Worker onmessageerror:', err);
      };

      this.worker.onerror = (err) => {
        console.error('[Stockfish] Worker onerror:', err);
        if (this.initTimeout) {
          clearTimeout(this.initTimeout);
          this.initTimeout = null;
        }
        this.setStatus('error');
        if (this.callbacks.onError) {
          this.callbacks.onError('Failed to load Stockfish engine. Please check if /stockfish.wasm.js or /stockfish.js is accessible.');
        }
      };

      // Step 1: Send UCI handshake
      console.log('[Stockfish Input] Sending: uci');
      this.worker.postMessage('uci');
      return true;
    } catch (err) {
      console.error('Failed to instantiate Stockfish worker:', err);
      if (this.initTimeout) {
        clearTimeout(this.initTimeout);
        this.initTimeout = null;
      }
      this.setStatus('error');
      if (this.callbacks.onError) {
        this.callbacks.onError('Unable to initialize Stockfish worker: ' + String(err));
      }
      return false;
    }
  }

  public configure(settings: Partial<EngineSettings>): void {
    if (settings.multiPv !== undefined) {
      this.currentMultiPv = Math.max(1, Math.min(5, settings.multiPv));
      if (this.worker && this.isReady) {
        this.worker.postMessage(`setoption name MultiPV value ${this.currentMultiPv}`);
      }
    }

    if (settings.depth !== undefined) {
      this.targetDepth = Math.max(5, Math.min(30, settings.depth));
    }
  }

  public startAnalysis(fen: string, depth: number = this.targetDepth, multiPv: number = this.currentMultiPv): void {
    this.targetDepth = depth;
    this.currentMultiPv = multiPv;

    if (!this.worker) {
      const initialized = this.init();
      if (!initialized) return;
    }

    // If engine is not ready yet, store as pending search
    if (!this.isReady) {
      this.pendingSearch = { fen, depth, multiPv };
      this.setStatus('loading');
      return;
    }

    // If currently calculating, queue the new search and request stop from the engine
    if (this.isSearching) {
      this.pendingSearch = { fen, depth, multiPv };
      this.ignoreSearchOutput = true;
      try {
        this.worker?.postMessage('stop');
      } catch {
        // Safe stop
      }
      return;
    }

    this.executeSearch({ fen, depth, multiPv });
  }

  private executeSearch(search: PendingSearch): void {
    if (!this.worker || !this.isReady) return;

    this.currentFen = search.fen;
    try {
      const chess = new Chess(search.fen);
      this.currentTurn = chess.turn();
    } catch {
      this.currentTurn = 'w';
    }

    this.currentLines.clear();
    this.ignoreSearchOutput = false;
    this.setStatus('analyzing');
    this.isSearching = true;

    // Send UCI commands in correct order
    this.worker.postMessage(`setoption name MultiPV value ${search.multiPv}`);
    this.worker.postMessage(`position fen ${search.fen}`);
    this.worker.postMessage(`go depth ${search.depth}`);
  }

  public stop(): void {
    this.pendingSearch = null;
    if (this.worker && this.isSearching) {
      this.ignoreSearchOutput = true;
      try {
        this.worker.postMessage('stop');
      } catch {
        // Safe stop
      }
    }
    this.isSearching = false;
    if (this.status === 'analyzing') {
      this.setStatus('ready');
    }
  }

  public terminate(): void {
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
      this.initTimeout = null;
    }

    if (this.worker) {
      try {
        this.worker.postMessage('quit');
        this.worker.terminate();
      } catch {
        // Safe termination
      }
      this.worker = null;
    }

    this.isSearching = false;
    this.isReady = false;
    this.pendingSearch = null;
    this.currentLines.clear();
    this.setStatus('uninitialized');
  }

  private setStatus(newStatus: EngineStatus): void {
    this.status = newStatus;
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(newStatus);
    }
  }

  /**
   * Parses raw text output from the Stockfish UCI engine.
   */
  public handleEngineOutput(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Step 2: Handle 'uciok'
    if (trimmed === 'uciok' || trimmed.endsWith('uciok')) {
      if (this.worker) {
        this.worker.postMessage(`setoption name MultiPV value ${this.currentMultiPv}`);
        this.worker.postMessage('isready');
      }
      return;
    }

    // Step 3: Handle 'readyok'
    if (trimmed === 'readyok' || trimmed.endsWith('readyok')) {
      if (this.initTimeout) {
        clearTimeout(this.initTimeout);
        this.initTimeout = null;
      }
      this.isReady = true;

      // If a position was requested before engine became ready, execute it immediately
      if (this.pendingSearch) {
        const next = this.pendingSearch;
        this.pendingSearch = null;
        this.executeSearch(next);
      } else {
        if (this.status === 'loading') {
          this.setStatus('ready');
        }
      }
      return;
    }

    // Parse 'info depth ...' search updates
    if (trimmed.startsWith('info depth ')) {
      if (this.pendingSearch || this.ignoreSearchOutput) return;
      this.parseInfoLine(trimmed);
      return;
    }

    // Parse 'bestmove ...' command
    if (trimmed.startsWith('bestmove ')) {
      this.isSearching = false;

      // If a new search was queued while this one was finishing, ignore old bestmove and start the new search immediately
      if (this.pendingSearch) {
        const next = this.pendingSearch;
        this.pendingSearch = null;
        this.ignoreSearchOutput = false;
        this.executeSearch(next);
        return;
      }

      const ignoreOutput = this.ignoreSearchOutput;
      this.ignoreSearchOutput = false;
      if (!ignoreOutput) {
        const bestMoveUci = this.parseBestMove(trimmed);
        this.callbacks.onSearchComplete?.(this.currentFen, bestMoveUci);
      }

      if (this.status === 'analyzing') {
        this.setStatus('ready');
      }
      return;
    }
  }

  /**
   * Parse UCI info string:
   * e.g. "info depth 10 seldepth 14 multipv 1 score cp 32 nodes 1234 nps 98000 time 85 pv e2e4 e7e5 g1f3"
   */
  public parseInfoLine(line: string): void {
    const tokens = line.split(/\s+/);

    const depthIdx = tokens.indexOf('depth');
    const multiPvIdx = tokens.indexOf('multipv');
    const scoreIdx = tokens.indexOf('score');
    const nodesIdx = tokens.indexOf('nodes');
    const npsIdx = tokens.indexOf('nps');
    const timeIdx = tokens.indexOf('time');
    const pvIdx = tokens.indexOf('pv');

    if (depthIdx === -1 || scoreIdx === -1 || pvIdx === -1) {
      return;
    }

    const depth = parseInt(tokens[depthIdx + 1], 10) || 0;
    const multipv = multiPvIdx !== -1 ? parseInt(tokens[multiPvIdx + 1], 10) || 1 : 1;
    const scoreType = tokens[scoreIdx + 1]; // 'cp' or 'mate'
    const scoreRaw = parseInt(tokens[scoreIdx + 2], 10);

    if (isNaN(scoreRaw)) return;

    // Normalization to White's perspective (+ White ahead, - Black ahead)
    const isWhiteTurn = this.currentTurn === 'w';
    let scoreCp: number | undefined;
    let scoreMate: number | undefined;

    if (scoreType === 'cp') {
      scoreCp = isWhiteTurn ? scoreRaw : -scoreRaw;
    } else if (scoreType === 'mate') {
      scoreMate = isWhiteTurn ? scoreRaw : -scoreRaw;
    }

    // Format score display label
    let scoreDisplay = '0.0';
    if (scoreMate !== undefined) {
      scoreDisplay = scoreMate > 0 ? `+M${scoreMate}` : `-M${Math.abs(scoreMate)}`;
    } else if (scoreCp !== undefined) {
      const val = scoreCp / 100;
      scoreDisplay = val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
    }

    const nodes = nodesIdx !== -1 ? parseInt(tokens[nodesIdx + 1], 10) : undefined;
    const nps = npsIdx !== -1 ? parseInt(tokens[npsIdx + 1], 10) : undefined;
    const timeMs = timeIdx !== -1 ? parseInt(tokens[timeIdx + 1], 10) : undefined;

    // Extract UCI move sequence
    const rawPv = tokens.slice(pvIdx + 1);
    const pvUci: string[] = [];
    const pvSan: string[] = [];
    let bestMoveSan = '';
    let bestMoveFrom: ChessSquare | undefined;
    let bestMoveTo: ChessSquare | undefined;

    try {
      const tempChess = new Chess(this.currentFen);
      for (let i = 0; i < rawPv.length; i++) {
        const uciMove = rawPv[i];
        if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uciMove)) break;

        const from = uciMove.slice(0, 2) as Square;
        const to = uciMove.slice(2, 4) as Square;
        const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

        let moveRes;
        try {
          moveRes = tempChess.move({ from, to, promotion });
        } catch {
          if (i === 0) return;
          break;
        }
        if (!moveRes) {
          if (i === 0) return;
          break;
        }

        pvUci.push(uciMove);
        pvSan.push(moveRes.san);

        if (i === 0) {
          bestMoveSan = moveRes.san;
          bestMoveFrom = from as ChessSquare;
          bestMoveTo = to as ChessSquare;
        }
      }
    } catch {
      // In case position is malformed
    }

    if (pvUci.length === 0 || !bestMoveFrom || !bestMoveTo) return;
    const firstMoveUci = pvUci[0];

    const evalLine: EngineEvaluation = {
      multipv,
      depth,
      scoreCp,
      scoreMate,
      scoreDisplay,
      nodes,
      nps,
      timeMs,
      pvUci,
      pvSan,
      bestMoveUci: firstMoveUci,
      bestMoveSan,
      bestMoveFrom,
      bestMoveTo,
    };

    this.currentLines.set(multipv, evalLine);

    // Notify listener
    if (this.callbacks.onEvaluationUpdate) {
      const sortedLines = Array.from(this.currentLines.values()).sort((a, b) => a.multipv - b.multipv);
      this.callbacks.onEvaluationUpdate(sortedLines, depth, this.currentFen);
    }
  }

  /**
   * Parse 'bestmove <move> [ponder <move>]'
   */
  private parseBestMove(line: string): string | null {
    const parts = line.split(/\s+/);
    const bestMoveUci = parts[1];
    if (!bestMoveUci || bestMoveUci === '(none)') return null;
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(bestMoveUci)) return null;

    const from = bestMoveUci.slice(0, 2) as ChessSquare;
    const to = bestMoveUci.slice(2, 4) as ChessSquare;
    const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;

    let bestMoveSan: string;
    try {
      const tempChess = new Chess(this.currentFen);
      const moveRes = tempChess.move({ from: from as Square, to: to as Square, promotion });
      if (!moveRes) return null;
      bestMoveSan = moveRes.san;
    } catch {
      return null;
    }

    if (this.callbacks.onBestMove) {
      this.callbacks.onBestMove(bestMoveUci, bestMoveSan, from, to, this.currentFen);
    }

    // Ensure onEvaluationUpdate is finalized with all available lines
    if (this.callbacks.onEvaluationUpdate) {
      const sortedLines = Array.from(this.currentLines.values()).sort((a, b) => a.multipv - b.multipv);
      if (sortedLines.length > 0) this.callbacks.onEvaluationUpdate(sortedLines, this.targetDepth, this.currentFen);
    }
    return bestMoveUci;
  }
}
