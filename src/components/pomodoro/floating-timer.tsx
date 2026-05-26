'use client';

import * as React from 'react';
import { usePomodoro } from './pomodoro-context';
import { usePathname } from 'next/navigation';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingTimer() {
  const { timeLeft, isActive, mode, toggleTimer, resetTimer, formatTime } = usePomodoro();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);

  // Don't show the floating timer on the main pomodoro page
  if (pathname === '/pomodoro' || !isActive && timeLeft === (mode === 'work' ? 1500 : mode === 'shortBreak' ? 300 : 900)) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className={cn(
        "bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[32px] p-4 flex items-center gap-4 transition-all hover:scale-105",
        mode === 'work' ? "border-primary/20" : "border-accent/20"
      )}>
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
          mode === 'work' ? "bg-primary" : "bg-accent text-accent-foreground"
        )}>
          <Clock className="h-6 w-6" />
        </div>
        
        <div className="flex flex-col pr-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">
            {mode === 'work' ? 'focusing' : 'resting'}
          </span>
          <span className="text-2xl font-bold font-mono tracking-tighter leading-none">
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTimer} className="h-10 w-10 rounded-xl hover:bg-muted">
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={resetTimer} className="h-10 w-10 rounded-xl hover:bg-muted">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="h-10 w-10 rounded-xl hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
