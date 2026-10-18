import { useState, useEffect, useRef, useCallback } from 'react';
import { PieceColor, TimeControl, ClockState } from '../types/chess';
import { DEFAULT_TIME_CONTROL } from '../utils/timeUtils';
import { soundManager } from '../core/sound';

interface UseChessClockOptions {
  timeControl?: TimeControl;
  onTimeout?: (timedOutColor: PieceColor) => void;
  soundEnabled?: boolean;
}

export const useChessClock = (options: UseChessClockOptions = {}) => {
  const {
    timeControl = DEFAULT_TIME_CONTROL,
    onTimeout,
    soundEnabled = true,
  } = options;

  const [activeTimeControl, setActiveTimeControl] = useState<TimeControl>(timeControl);

  // Time in milliseconds
  const initialMs = activeTimeControl.isUnlimited
    ? Infinity
    : activeTimeControl.initialMinutes * 60 * 1000;

  const [whiteTimeMs, setWhiteTimeMs] = useState<number>(initialMs);
  const [blackTimeMs, setBlackTimeMs] = useState<number>(initialMs);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeColor, setActiveColor] = useState<PieceColor | null>(null);

  const lastTimestampRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickSecondRef = useRef<{ w: number; b: number }>({ w: -1, b: -1 });

  // Reset clock when time control changes
  const resetClock = useCallback(
    (newTimeControl: TimeControl = activeTimeControl) => {
      setActiveTimeControl(newTimeControl);
      const ms = newTimeControl.isUnlimited ? Infinity : newTimeControl.initialMinutes * 60 * 1000;
      setWhiteTimeMs(ms);
      setBlackTimeMs(ms);
      setIsRunning(false);
      setActiveColor(null);
      lastTimestampRef.current = null;
      lastTickSecondRef.current = { w: -1, b: -1 };
    },
    [activeTimeControl]
  );

  // Start clock for a specific player
  const startClock = useCallback((color: PieceColor = 'w') => {
    if (activeTimeControl.isUnlimited) {
      setActiveColor(color);
      setIsRunning(true);
      return;
    }
    setActiveColor(color);
    setIsRunning(true);
    lastTimestampRef.current = Date.now();
  }, [activeTimeControl.isUnlimited]);

  // Pause clock (e.g. game over or browsing history)
  const pauseClock = useCallback(() => {
    setIsRunning(false);
    lastTimestampRef.current = null;
  }, []);

  // Switch clock on legal move and add increment
  const switchTurn = useCallback(
    (newTurn: PieceColor) => {
      if (activeTimeControl.isUnlimited) {
        setActiveColor(newTurn);
        return;
      }

      const prevColor: PieceColor = newTurn === 'w' ? 'b' : 'w';
      const incMs = activeTimeControl.incrementSeconds * 1000;

      // Add increment to the player who just moved
      if (prevColor === 'w') {
        setWhiteTimeMs((prev) => Math.max(0, prev + incMs));
      } else {
        setBlackTimeMs((prev) => Math.max(0, prev + incMs));
      }

      setActiveColor(newTurn);
      setIsRunning(true);
      lastTimestampRef.current = Date.now();
    },
    [activeTimeControl]
  );

  // High-accuracy delta-based timer loop
  useEffect(() => {
    if (!isRunning || activeTimeControl.isUnlimited || activeColor === null) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      const last = lastTimestampRef.current || now;
      const delta = now - last;
      lastTimestampRef.current = now;

      if (activeColor === 'w') {
        setWhiteTimeMs((prev) => {
          const next = Math.max(0, prev - delta);
          // Low time warning tick
          if (next > 0 && next <= 10000 && soundEnabled) {
            const curSec = Math.floor(next / 1000);
            if (curSec !== lastTickSecondRef.current.w) {
              lastTickSecondRef.current.w = curSec;
              soundManager.playLowTimeTick();
            }
          }
          if (next <= 0) {
            setIsRunning(false);
            if (onTimeout) onTimeout('w');
            return 0;
          }
          return next;
        });
      } else {
        setBlackTimeMs((prev) => {
          const next = Math.max(0, prev - delta);
          if (next > 0 && next <= 10000 && soundEnabled) {
            const curSec = Math.floor(next / 1000);
            if (curSec !== lastTickSecondRef.current.b) {
              lastTickSecondRef.current.b = curSec;
              soundManager.playLowTimeTick();
            }
          }
          if (next <= 0) {
            setIsRunning(false);
            if (onTimeout) onTimeout('b');
            return 0;
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    lastTimestampRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, activeColor, activeTimeControl.isUnlimited, soundEnabled, onTimeout]);

  const clockState: ClockState = {
    whiteTimeMs,
    blackTimeMs,
    isRunning,
    activeColor,
  };

  return {
    whiteTimeMs,
    blackTimeMs,
    isRunning,
    activeColor,
    activeTimeControl,
    clockState,
    startClock,
    pauseClock,
    switchTurn,
    resetClock,
    setWhiteTimeMs,
    setBlackTimeMs,
  };
};
