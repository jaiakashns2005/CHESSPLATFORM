import { describe, it, expect } from 'vitest';
import { parsePGN, buildPGN } from '../src/utils/chessUtils';
import { MoveHistoryItem, PGNMetadata } from '../src/types/chess';

describe('PGN Subsystem - Export, Import, Replay & Validation', () => {
  const operaGamePGN = `
[Event "Paris"]
[Site "Paris FRA"]
[Date "1858.11.02"]
[Round "1"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]
[WhiteElo "2600"]
[BlackElo "2100"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 
9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 
15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0
`;

  it('should parse complete PGN game and extract all metadata headers', () => {
    const parsed = parsePGN(operaGamePGN);

    expect(parsed.success).toBe(true);
    expect(parsed.metadata.event).toBe('Paris');
    expect(parsed.metadata.white).toBe('Paul Morphy');
    expect(parsed.metadata.black).toBe('Duke Karl / Count Isouard');
    expect(parsed.metadata.result).toBe('1-0');
    expect(parsed.metadata.date).toBe('1858.11.02');
    expect(parsed.movesCount).toBe(33); // 33 ply (17 moves with White checkmating on move 17)
  });

  it('should verify final checkmate position from imported PGN', () => {
    const parsed = parsePGN(operaGamePGN);
    expect(parsed.success).toBe(true);

    const lastMove = parsed.history[parsed.history.length - 1];
    expect(lastMove.san).toBe('Rd8#');
    expect(lastMove.isCheckmate).toBe(true);
  });

  it('should parse PGN containing comments, NAGs and inline annotations', () => {
    const annotatedPGN = `
[Event "Annotated Test"]
[White "Player A"]
[Black "Player B"]
[Result "1-0"]

1. e4 {Best by test} e5 2. Nf3 $1 Nc6 3. Bc4 Bc5 4. b4!? {Evans Gambit} Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O 1-0
`;
    const parsed = parsePGN(annotatedPGN);
    expect(parsed.success).toBe(true);
    expect(parsed.movesCount).toBe(13);
    expect(parsed.history[6].san).toBe('b4');
  });

  it('should safely handle and report invalid PGN with illegal moves', () => {
    const trulyBrokenPGN = `
[Event "Broken Test"]
1. e4 e5 2. Qxh8 Qh4 1-0
`; // 2. Qxh8 is impossible from starting position

    const parsed = parsePGN(trulyBrokenPGN);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Invalid move');
  });

  it('should build and format a complete PGN string from move history and metadata', () => {
    const mockHistory: MoveHistoryItem[] = [
      {
        id: '1',
        san: 'e4',
        from: 'e2',
        to: 'e4',
        piece: 'p',
        color: 'w',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        moveNumber: 1,
        isCheck: false,
        isCheckmate: false,
        timestamp: Date.now(),
      },
      {
        id: '2',
        san: 'e5',
        from: 'e7',
        to: 'e5',
        piece: 'p',
        color: 'b',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        moveNumber: 1,
        isCheck: false,
        isCheckmate: false,
        timestamp: Date.now(),
      },
      {
        id: '3',
        san: 'Nf3',
        from: 'g1',
        to: 'f3',
        piece: 'n',
        color: 'w',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        moveNumber: 2,
        isCheck: false,
        isCheckmate: false,
        timestamp: Date.now(),
      },
    ];

    const metadata: PGNMetadata = {
      event: 'Championship Finals',
      white: 'Magnus Carlsen',
      black: 'Hikaru Nakamura',
      result: '1-0',
      timeControl: '180+2',
    };

    const pgn = buildPGN(mockHistory, metadata);
    expect(pgn).toContain('[Event "Championship Finals"]');
    expect(pgn).toContain('[White "Magnus Carlsen"]');
    expect(pgn).toContain('[Black "Hikaru Nakamura"]');
    expect(pgn).toContain('[TimeControl "180+2"]');
    expect(pgn).toContain('1. e4 e5 2. Nf3 1-0');
  });
});
