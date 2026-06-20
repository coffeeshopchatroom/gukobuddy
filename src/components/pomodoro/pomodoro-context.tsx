'use client';

import * as React from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroContextType {
  timeLeft: number;
  isActive: boolean;
  mode: TimerMode;
  customTimes: Record<TimerMode, number>;
  setIsActive: (active: boolean) => void;
  setMode: (mode: TimerMode) => void;
  updateCustomTime: (mode: TimerMode, minutes: number) => void;
  resetTimer: () => void;
  toggleTimer: () => void;
  formatTime: (seconds: number) => string;
}

const PomodoroContext = React.createContext<PomodoroContextType | undefined>(undefined);

const DEFAULT_TIMES: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [customTimes, setCustomTimes] = React.useState<Record<TimerMode, number>>(DEFAULT_TIMES);
  const [mode, setMode] = React.useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = React.useState(DEFAULT_TIMES.work);
  const [isActive, setIsActive] = React.useState(false);

  // Sync timeLeft when mode changes or customTimes are updated
  React.useEffect(() => {
    if (!isActive) {
      setTimeLeft(customTimes[mode]);
    }
  }, [mode, customTimes]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Native notification logic could go here
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(customTimes[mode]);
  };

  const handleSetMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(customTimes[newMode]);
  };

  const updateCustomTime = (mode: TimerMode, minutes: number) => {
    const seconds = minutes * 60;
    setCustomTimes(prev => ({ ...prev, [mode]: seconds }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PomodoroContext.Provider
      value={{
        timeLeft,
        isActive,
        mode,
        customTimes,
        setIsActive,
        setMode: handleSetMode,
        updateCustomTime,
        resetTimer,
        toggleTimer,
        formatTime,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = React.useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
