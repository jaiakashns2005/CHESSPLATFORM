import { describe, it, expect } from 'vitest';
import { StockfishService } from '../src/core/engine/stockfishService';
import {
  calculateWinPercentage,
  classifyMoveEvaluation,
  getPlayerPerspectiveScore,
} from '../src/core/engine/moveQuality';
import { EngineEvaluation } from '../src/types/engine';
import { STARTING_FEN } from '../src/utils/chessUtils';

describe('Stockfish Engine Service & UCI Protocol Parsing', () => {
  it('should parse centipawn info line for White to move', () => {
    let receivedLines: EngineEvaluation[] = [];
    const service = new StockfishService({
      onEvaluationUpdate: (lines) => {
        receivedLines = lines;
      },
    });

    // Simulate start of analysis for standard starting position (White turn)
    // We can simulate parsing directly via handleEngineOutput
    // @ts-expect-error setting private field for test
    service.currentFen = STARTING_FEN;
    // @ts-expect-error setting private field for test
    service.currentTurn = 'w';

    const infoLine = 'info depth 10 seldepth 12 multipv 1 score cp 35 nodes 14200 nps 110000 time 120 pv e2e4 e7e5 g1f3';
    service.handleEngineOutput(infoLine);

    expect(receivedLines.length).toBe(1);
    const line1 = receivedLines[0];
    expect(line1.multipv).toBe(1);
    expect(line1.depth).toBe(10);
    expect(line1.scoreCp).toBe(35);
    expect(line1.scoreDisplay).toBe('+0.3');
    expect(line1.nodes).toBe(14200);
    expect(line1.pvUci).toEqual(['e2e4', 'e7e5', 'g1f3']);
    expect(line1.pvSan).toEqual(['e4', 'e5', 'Nf3']);
    expect(line1.bestMoveUci).toBe('e2e4');
    expect(line1.bestMoveSan).toBe('e4');
    expect(line1.bestMoveFrom).toBe('e2');
    expect(line1.bestMoveTo).toBe('e4');
  });

  it('should normalize centipawn score to White perspective when Black is to move', () => {
    let receivedLines: EngineEvaluation[] = [];
    const service = new StockfishService({
      onEvaluationUpdate: (lines) => {
        receivedLines = lines;
      },
    });

    // Position after 1. e4 (Black to move)
    const fenBlackTurn = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    // @ts-expect-error setting private field for test
    service.currentFen = fenBlackTurn;
    // @ts-expect-error setting private field for test
    service.currentTurn = 'b';

    // Stockfish says score cp -25 (from Black's perspective, Black is down 0.25)
    // From White's absolute perspective, White is ahead (+25 cp)
    const infoLine = 'info depth 12 multipv 1 score cp -25 nodes 20000 pv e7e5 g1f3';
    service.handleEngineOutput(infoLine);

    expect(receivedLines.length).toBe(1);
    expect(receivedLines[0].scoreCp).toBe(25);
    expect(receivedLines[0].scoreDisplay).toBe('+0.3');
  });

  it('should parse mate scores correctly', () => {
    let receivedLines: EngineEvaluation[] = [];
    const service = new StockfishService({
      onEvaluationUpdate: (lines) => {
        receivedLines = lines;
      },
    });

    // @ts-expect-error setting private field for test
    service.currentFen = STARTING_FEN;
    // @ts-expect-error setting private field for test
    service.currentTurn = 'w';

    // White has mate in 2
    service.handleEngineOutput('info depth 14 multipv 1 score mate 2 nodes 50000 pv e2e4 e7e5');
    expect(receivedLines[0].scoreMate).toBe(2);
    expect(receivedLines[0].scoreDisplay).toBe('+M2');

    // White gets mated in 3
    service.handleEngineOutput('info depth 14 multipv 1 score mate -3 nodes 50000 pv e2e4 e7e5');
    expect(receivedLines[0].scoreMate).toBe(-3);
    expect(receivedLines[0].scoreDisplay).toBe('-M3');
  });

  it('should parse and sort multiple candidate lines (Multi-PV)', () => {
    let receivedLines: EngineEvaluation[] = [];
    const service = new StockfishService({
      onEvaluationUpdate: (lines) => {
        receivedLines = lines;
      },
    });

    // @ts-expect-error setting private field for test
    service.currentFen = STARTING_FEN;
    // @ts-expect-error setting private field for test
    service.currentTurn = 'w';

    service.handleEngineOutput('info depth 10 multipv 2 score cp 15 nodes 10000 pv d2d4 d7d5');
    service.handleEngineOutput('info depth 10 multipv 1 score cp 30 nodes 12000 pv e2e4 e7e5');

    expect(receivedLines.length).toBe(2);
    expect(receivedLines[0].multipv).toBe(1);
    expect(receivedLines[0].bestMoveSan).toBe('e4');
    expect(receivedLines[1].multipv).toBe(2);
    expect(receivedLines[1].bestMoveSan).toBe('d4');
  });

  it('should parse bestmove commands and invoke callback', () => {
    let bestMoveData: { uci: string; san: string; from: string; to: string } | null = null;
    const service = new StockfishService({
      onBestMove: (uci, san, from, to) => {
        bestMoveData = { uci, san, from, to };
      },
    });

    // @ts-expect-error setting private field for test
    service.currentFen = STARTING_FEN;
    // @ts-expect-error setting private field for test
    service.currentTurn = 'w';

    service.handleEngineOutput('bestmove g1f3 ponder d7d5');

    expect(bestMoveData).not.toBeNull();
    const data = bestMoveData as unknown as { uci: string; san: string; from: string; to: string };
    expect(data.uci).toBe('g1f3');
    expect(data.san).toBe('Nf3');
    expect(data.from).toBe('g1');
    expect(data.to).toBe('f3');
  });

  it('should handle search stopping and termination', () => {
    const service = new StockfishService();
    // @ts-expect-error setting private field for test
    service.isSearching = true;
    // @ts-expect-error setting private field for test
    service.status = 'analyzing';

    service.stop();
    expect(service.isEngineSearching()).toBe(false);

    service.terminate();
    expect(service.getStatus()).toBe('uninitialized');
  });

  it('should queue pending search if engine is not ready and execute upon readyok', () => {
    const service = new StockfishService();
    const postedMessages: string[] = [];
    // @ts-expect-error setting mock worker for test
    service.worker = {
      postMessage: (msg: string) => postedMessages.push(msg),
    };

    // Engine is NOT ready yet
    expect(service.isEngineReady()).toBe(false);

    // Client requests analysis
    service.startAnalysis(STARTING_FEN, 12, 2);

    // It should NOT have posted position fen or go depth yet
    expect(postedMessages).not.toContain('go depth 12');
    expect(service.getStatus()).toBe('loading');

    // Engine replies uciok
    service.handleEngineOutput('uciok');
    expect(postedMessages).toContain('isready');

    // Engine replies readyok
    service.handleEngineOutput('readyok');

    // Now it should be ready and have executed the queued search!
    expect(service.isEngineReady()).toBe(true);
    expect(postedMessages).toContain(`position fen ${STARTING_FEN}`);
    expect(postedMessages).toContain('go depth 12');
    expect(service.isEngineSearching()).toBe(true);
    expect(service.getStatus()).toBe('analyzing');
  });

  it('should process multi-line string output correctly', () => {
    let receivedLines: EngineEvaluation[] = [];
    const service = new StockfishService({
      onEvaluationUpdate: (lines) => {
        receivedLines = lines;
      },
    });

    // @ts-expect-error setting private field for test
    service.currentFen = STARTING_FEN;
    // @ts-expect-error setting private field for test
    service.currentTurn = 'w';

    // Simulate multi-line chunk from worker
    const multiLineChunk = `info depth 1 seldepth 1 multipv 1 score cp 30 nodes 50 pv e2e4\ninfo depth 2 seldepth 2 multipv 1 score cp 35 nodes 100 pv e2e4 e7e5`;
    const lines = multiLineChunk.split(/\r?\n/);
    for (const l of lines) {
      service.handleEngineOutput(l);
    }

    expect(receivedLines.length).toBe(1);
    expect(receivedLines[0].depth).toBe(2);
    expect(receivedLines[0].scoreCp).toBe(35);
  });

  it('should ignore old search output after a new FEN supersedes it', () => {
    const castleFen = '4k2r/8/8/8/8/8/8/4K3 b k - 0 1';
    const blockedCastleFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
    let receivedLines: EngineEvaluation[] = [];
    let bestMove: { uci: string; san: string; fen: string } | null = null;
    const postedMessages: string[] = [];
    const service = new StockfishService({
      onEvaluationUpdate: (lines) => { receivedLines = lines; },
      onBestMove: (uci, san, _from, _to, fen) => { bestMove = { uci, san, fen }; },
    });
    // @ts-expect-error setting worker and active search state for test
    service.worker = { postMessage: (message: string) => postedMessages.push(message) };
    // @ts-expect-error setting private state for test
    service.isReady = true;
    // @ts-expect-error setting private state for test
    service.isSearching = true;
    // @ts-expect-error setting private state for test
    service.currentFen = castleFen;

    service.startAnalysis(blockedCastleFen, 15, 1);
    service.handleEngineOutput('info depth 8 multipv 1 score cp 20 pv e8g8');
    expect(receivedLines).toEqual([]);
    expect(bestMove).toBeNull();

    service.handleEngineOutput('bestmove e8g8');
    expect(postedMessages).toContain(`position fen ${blockedCastleFen}`);
    expect(postedMessages).toContain('go depth 15');

    service.handleEngineOutput('info depth 1 multipv 1 score cp 20 pv e7e5');
    service.handleEngineOutput('bestmove e7e5');
    expect((bestMove as unknown as { uci: string; san: string; fen: string })).toEqual({
      uci: 'e7e5',
      san: 'e5',
      fen: blockedCastleFen,
    });
  });

  it('should not publish an illegal bestmove or PV for the active FEN', () => {
    const blockedCastleFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
    const receivedLines: EngineEvaluation[] = [];
    let bestMove: string | null = null;
    const service = new StockfishService({
      onEvaluationUpdate: (lines) => { receivedLines.push(...lines); },
      onBestMove: (uci) => { bestMove = uci; },
    });
    // @ts-expect-error setting current position for test
    service.currentFen = blockedCastleFen;

    service.handleEngineOutput('info depth 8 multipv 1 score cp 20 pv e8g8');
    service.handleEngineOutput('bestmove e8g8');

    expect(receivedLines).toEqual([]);
    expect(bestMove).toBeNull();
  });

  it('should convert a legal UCI castle using the active FEN', () => {
    const castleFen = '4k2r/8/8/8/8/8/8/4K3 b k - 0 1';
    let bestMove: { uci: string; san: string; from: string; to: string; fen: string } | null = null;
    const service = new StockfishService({
      onBestMove: (uci, san, from, to, fen) => { bestMove = { uci, san, from, to, fen }; },
    });
    // @ts-expect-error setting current position for test
    service.currentFen = castleFen;

    service.handleEngineOutput('bestmove e8g8');

    expect(bestMove).toEqual({ uci: 'e8g8', san: 'O-O', from: 'e8', to: 'g8', fen: castleFen });
  });
});

describe('Move Quality & Classification Math', () => {
  it('should calculate win percentage using standard logistic model', () => {
    // 0 cp should be 50%
    const evenWinPct = calculateWinPercentage(0);
    expect(evenWinPct).toBeCloseTo(50, 1);

    // +400 cp advantage for White should be ~80%+
    const whiteWinPct = calculateWinPercentage(400);
    expect(whiteWinPct).toBeGreaterThan(80);

    // -400 cp disadvantage should be ~20%-
    const blackWinPct = calculateWinPercentage(-400);
    expect(blackWinPct).toBeLessThan(20);
  });

  it('should calculate player perspective score', () => {
    expect(getPlayerPerspectiveScore(150, 'w')).toBe(150);
    expect(getPlayerPerspectiveScore(150, 'b')).toBe(-150);
  });

  it('should classify moves accurately based on centipawn loss', () => {
    // Exact match
    const bestMove = classifyMoveEvaluation('e2e4', 'e4', 'e2e4', 'e4', 30, 30);
    expect(bestMove.classification).toBe('best');
    expect(bestMove.centipawnLoss).toBe(0);

    // Excellent move (loss <= 20 cp)
    const excellentMove = classifyMoveEvaluation('d2d4', 'd4', 'e2e4', 'e4', 30, 15);
    expect(excellentMove.classification).toBe('excellent');
    expect(excellentMove.centipawnLoss).toBe(15);

    // Good move (loss <= 50 cp)
    const goodMove = classifyMoveEvaluation('c2c4', 'c4', 'e2e4', 'e4', 30, -10);
    expect(goodMove.classification).toBe('good');
    expect(goodMove.centipawnLoss).toBe(40);

    // Inaccuracy (loss <= 100 cp)
    const inaccuracyMove = classifyMoveEvaluation('g1f3', 'Nf3', 'e2e4', 'e4', 30, -45);
    expect(inaccuracyMove.classification).toBe('inaccuracy');
    expect(inaccuracyMove.centipawnLoss).toBe(75);

    // Mistake (loss <= 200 cp)
    const mistakeMove = classifyMoveEvaluation('f2f3', 'f3', 'e2e4', 'e4', 30, -120);
    expect(mistakeMove.classification).toBe('mistake');
    expect(mistakeMove.centipawnLoss).toBe(150);

    // Blunder (loss > 200 cp)
    const blunderMove = classifyMoveEvaluation('g2g4', 'g4', 'e2e4', 'e4', 30, -280);
    expect(blunderMove.classification).toBe('blunder');
    expect(blunderMove.centipawnLoss).toBe(310);

    // Forced move
    const forcedMove = classifyMoveEvaluation('e8e7', 'Ke7', 'e8e7', 'Ke7', -500, -500, true);
    expect(forcedMove.classification).toBe('forced');
  });
});
