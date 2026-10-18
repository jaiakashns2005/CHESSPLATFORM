import { describe, it, expect } from 'vitest';
import { formatClockTime, formatTimeControlLabel } from '../src/utils/timeUtils';
import { hasInsufficientMaterialToMate } from '../src/utils/chessUtils';
import { TimeControl } from '../src/types/chess';

describe('Chess Clock & Time Control System', () => {
  describe('Time Formatting', () => {
    it('should format times over 1 minute as MM:SS', () => {
      expect(formatClockTime(300000)).toBe('05:00');
      expect(formatClockTime(65000)).toBe('01:05');
      expect(formatClockTime(600000)).toBe('10:00');
    });

    it('should format times between 10s and 60s as 0:SS', () => {
      expect(formatClockTime(45000)).toBe('0:45');
      expect(formatClockTime(12000)).toBe('0:12');
    });

    it('should format times under 10s with tenths of a second for precision scrambles', () => {
      expect(formatClockTime(9400)).toBe('0:09.4');
      expect(formatClockTime(3200)).toBe('0:03.2');
      expect(formatClockTime(500)).toBe('0:00.5');
      expect(formatClockTime(0)).toBe('0:00.0');
    });

    it('should format negative or zero time as 0:00.0 without crash or negative numbers', () => {
      expect(formatClockTime(0)).toBe('0:00.0');
      expect(formatClockTime(-500)).toBe('0:00.0');
    });

    it('should format TimeControl labels correctly', () => {
      const tc1: TimeControl = { id: '3+2', name: '3 + 2', category: 'blitz', initialMinutes: 3, incrementSeconds: 2 };
      expect(formatTimeControlLabel(tc1)).toBe('3 + 2 • BLITZ');

      const tc2: TimeControl = { id: '10+0', name: '10 min', category: 'rapid', initialMinutes: 10, incrementSeconds: 0 };
      expect(formatTimeControlLabel(tc2)).toBe('10 min • RAPID');

      const tc3: TimeControl = { id: 'unlimited', name: 'Unlimited', category: 'unlimited', initialMinutes: 0, incrementSeconds: 0, isUnlimited: true };
      expect(formatTimeControlLabel(tc3)).toBe('Unlimited (Casual)');
    });
  });

  describe('FIDE Timeout & Insufficient Material Rules', () => {
    it('should detect insufficient mating material when opponent has lone King', () => {
      // White has lone King, Black has Queen + King.
      // If Black flags, White has insufficient material -> Draw.
      const fen = '8/8/8/4k3/8/8/4K1q1/8 w - - 0 1';
      expect(hasInsufficientMaterialToMate(fen, 'w')).toBe(true);
      expect(hasInsufficientMaterialToMate(fen, 'b')).toBe(false);
    });

    it('should detect insufficient mating material for King + Knight vs King', () => {
      // White has King + Knight, Black has Queen.
      // If Black flags, White cannot force mate -> Draw.
      const fen = '8/8/8/4k3/8/2N5/4K1q1/8 w - - 0 1';
      expect(hasInsufficientMaterialToMate(fen, 'w')).toBe(true);
    });

    it('should detect insufficient mating material for King + Bishop vs King', () => {
      const fen = '8/8/8/4k3/8/2B5/4K1q1/8 w - - 0 1';
      expect(hasInsufficientMaterialToMate(fen, 'w')).toBe(true);
    });

    it('should recognize mating material if side has Pawns, Rooks, Queens, or 2 Bishops', () => {
      // White has a pawn
      const fenWithPawn = '8/8/8/4k3/4P3/8/4K3/8 w - - 0 1';
      expect(hasInsufficientMaterialToMate(fenWithPawn, 'w')).toBe(false);

      // White has a rook
      const fenWithRook = '8/8/8/4k3/8/8/4K2R/8 w - - 0 1';
      expect(hasInsufficientMaterialToMate(fenWithRook, 'w')).toBe(false);

      // White has two bishops
      const fenWith2Bishops = '8/8/8/4k3/8/2BB4/4K3/8 w - - 0 1';
      expect(hasInsufficientMaterialToMate(fenWith2Bishops, 'w')).toBe(false);
    });
  });
});
