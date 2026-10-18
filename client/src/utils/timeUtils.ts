import { TimeControl } from '../types/chess';

export const TIME_CONTROL_PRESETS: TimeControl[] = [
  // Bullet
  { id: '1+0', name: '1 min', category: 'bullet', initialMinutes: 1, incrementSeconds: 0 },
  { id: '1+1', name: '1 + 1', category: 'bullet', initialMinutes: 1, incrementSeconds: 1 },
  { id: '2+1', name: '2 + 1', category: 'bullet', initialMinutes: 2, incrementSeconds: 1 },

  // Blitz
  { id: '3+0', name: '3 min', category: 'blitz', initialMinutes: 3, incrementSeconds: 0 },
  { id: '3+2', name: '3 + 2', category: 'blitz', initialMinutes: 3, incrementSeconds: 2 },
  { id: '5+0', name: '5 min', category: 'blitz', initialMinutes: 5, incrementSeconds: 0 },
  { id: '5+3', name: '5 + 3', category: 'blitz', initialMinutes: 5, incrementSeconds: 3 },

  // Rapid
  { id: '10+0', name: '10 min', category: 'rapid', initialMinutes: 10, incrementSeconds: 0 },
  { id: '15+10', name: '15 + 10', category: 'rapid', initialMinutes: 15, incrementSeconds: 10 },
  { id: '30+0', name: '30 min', category: 'rapid', initialMinutes: 30, incrementSeconds: 0 },

  // Classical
  { id: '60+0', name: '60 min', category: 'classical', initialMinutes: 60, incrementSeconds: 0 },
  { id: '90+30', name: '90 + 30', category: 'classical', initialMinutes: 90, incrementSeconds: 30 },

  // Unlimited / Casual
  { id: 'unlimited', name: 'Unlimited', category: 'unlimited', initialMinutes: 0, incrementSeconds: 0, isUnlimited: true },
];

export const DEFAULT_TIME_CONTROL = TIME_CONTROL_PRESETS.find((tc) => tc.id === '10+0') || TIME_CONTROL_PRESETS[7];

export const formatClockTime = (ms: number): string => {
  if (ms <= 0) return '0:00.0';

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);

  // Under 10 seconds: show tenths of a second for high precision bullet/blitz scrambles
  if (ms < 10000) {
    return `0:0${seconds}.${tenths}`;
  }

  // Under 1 minute
  if (minutes === 0) {
    const formattedSecs = seconds.toString().padStart(2, '0');
    return `0:${formattedSecs}`;
  }

  // 1 minute or more
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSecs = seconds.toString().padStart(2, '0');
  return `${formattedMinutes}:${formattedSecs}`;
};

export const formatTimeControlLabel = (tc: TimeControl): string => {
  if (tc.isUnlimited) return 'Unlimited (Casual)';
  if (tc.incrementSeconds > 0) {
    return `${tc.initialMinutes} + ${tc.incrementSeconds} • ${tc.category.toUpperCase()}`;
  }
  return `${tc.initialMinutes} min • ${tc.category.toUpperCase()}`;
};
