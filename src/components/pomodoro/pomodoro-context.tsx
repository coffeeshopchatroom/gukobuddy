'use client';

import * as React from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroContextType {
  timeLeft: number;
  isActive: boolean;
  mode: TimerMode;
  setIsActive: (active: boolean) => void;
  setMode: (mode: TimerMode) => void;
  resetTimer: () => void;
  toggleTimer: () => void;
  formatTime: (seconds: number) => string;
}

const PomodoroContext = React.createContext<PomodoroContextType | undefined>(undefined);

const TIMES: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = React.useState(TIMES.work);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a subtle sound or notification here if desired
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(TIMES[mode]);
  };

  const handleSetMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(TIMES[newMode]);
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
        setIsActive,
        setMode: handleSetMode,
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
