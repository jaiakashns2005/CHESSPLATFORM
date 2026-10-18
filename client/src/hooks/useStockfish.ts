import { useState, useEffect, useRef, useCallback } from 'react';
import { StockfishService } from '../core/engine/stockfishService';
import { EngineEvaluation, EngineSettings, EngineStatus } from '../types/engine';
import { ChessSquare } from '../types/chess';

export interface UseStockfishOptions {
  initialDepth?: number;
  initialMultiPv?: number;
  autoStart?: boolean;
}

export const useStockfish = (currentFen: string, options: UseStockfishOptions = {}) => {
  const { initialDepth = 15, initialMultiPv = 2, autoStart = true } = options;

  const [status, setStatus] = useState<EngineStatus>('uninitialized');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<EngineEvaluation[]>([]);
  const [analysisFen, setAnalysisFen] = useState<string | null>(null);
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [bestMoveSan, setBestMoveSan] = useState<string | null>(null);
  const [bestMoveUci, setBestMoveUci] = useState<string | null>(null);
  const [bestMoveFrom, setBestMoveFrom] = useState<ChessSquare | null>(null);
  const [bestMoveTo, setBestMoveTo] = useState<ChessSquare | null>(null);

  const [settings, setSettings] = useState<EngineSettings>({
    enabled: autoStart,
    depth: initialDepth,
    multiPv: initialMultiPv,
    threads: 1,
    hashSizeMb: 32,
  });

  const serviceRef = useRef<StockfishService | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFenRef = useRef(currentFen);
  currentFenRef.current = currentFen;

  // Initialize service instance
  useEffect(() => {
    const service = new StockfishService({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        setIsAnalyzing(newStatus === 'analyzing');
      },
      onEvaluationUpdate: (updatedLines, depth, analyzedFen) => {
        if (analyzedFen !== currentFenRef.current) return;
        setAnalysisFen(analyzedFen);
        setLines(updatedLines);
        setCurrentDepth(depth);
      },
      onBestMove: (uci, san, from, to, analyzedFen) => {
        if (analyzedFen !== currentFenRef.current) return;
        setAnalysisFen(analyzedFen);
        setBestMoveUci(uci);
        setBestMoveSan(san);
        setBestMoveFrom(from);
        setBestMoveTo(to);
      },
      onError: (errMessage) => {
        setError(errMessage);
        setStatus('error');
        setIsAnalyzing(false);
      },
    });

    serviceRef.current = service;
    if (settings.enabled) {
      service.init();
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      service.terminate();
      serviceRef.current = null;
    };
  }, []);

  // Update engine configuration when settings change
  useEffect(() => {
    if (!serviceRef.current) return;
    serviceRef.current.configure({
      depth: settings.depth,
      multiPv: settings.multiPv,
    });
  }, [settings.depth, settings.multiPv]);

  // Synchronize position analysis whenever currentFen or enabled status changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!settings.enabled) {
      if (serviceRef.current) {
        serviceRef.current.stop();
      }
      setIsAnalyzing(false);
      return;
    }

    // Reset current search indicators for the new position
    setLines([]);
    setAnalysisFen(null);
    setCurrentDepth(0);
    setBestMoveSan(null);
    setBestMoveUci(null);
    setBestMoveFrom(null);
    setBestMoveTo(null);

    // Debounce to prevent rapid UI thrashing during fast key navigation
    debounceTimerRef.current = setTimeout(() => {
      if (serviceRef.current && currentFen) {
        serviceRef.current.startAnalysis(currentFen, settings.depth, settings.multiPv);
      }
    }, 75);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentFen, settings.enabled, settings.depth, settings.multiPv]);

  const toggleEngine = useCallback(() => {
    setSettings((prev) => {
      const nextEnabled = !prev.enabled;
      if (nextEnabled && serviceRef.current && (serviceRef.current.getStatus() === 'uninitialized' || serviceRef.current.getStatus() === 'error')) {
        setError(null);
        serviceRef.current.init();
      }
      return { ...prev, enabled: nextEnabled };
    });
  }, []);

  const setDepth = useCallback((depth: number) => {
    setSettings((prev) => ({ ...prev, depth }));
  }, []);

  const setMultiPv = useCallback((multiPv: number) => {
    setSettings((prev) => ({ ...prev, multiPv }));
  }, []);

  const stopAnalysis = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
  }, []);

  const restartEngine = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.terminate();
      setError(null);
      serviceRef.current.init();
      if (settings.enabled && currentFen) {
        serviceRef.current.startAnalysis(currentFen, settings.depth, settings.multiPv);
      }
    }
  }, [currentFen, settings.enabled, settings.depth, settings.multiPv]);

  // Top line evaluation (multiPv 1)
  const topEvaluation = lines.length > 0 ? lines[0] : null;

  return {
    status,
    isAnalyzing,
    error,
    lines,
    analysisFen,
    topEvaluation,
    currentDepth,
    bestMoveSan,
    bestMoveUci,
    bestMoveFrom,
    bestMoveTo,
    settings,
    toggleEngine,
    setDepth,
    setMultiPv,
    stopAnalysis,
    restartEngine,
  };
};
