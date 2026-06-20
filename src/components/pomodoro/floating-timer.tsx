'use client';

import * as React from 'react';
import { usePomodoro } from './pomodoro-context';
import { usePathname } from 'next/navigation';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingTimer() {
  const { timeLeft, isActive, mode, customTimes, toggleTimer, resetTimer, formatTime } = usePomodoro();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);

  // Don't show the floating timer on the main pomodoro page
  if (pathname === '/pomodoro') {
    return null;
  }

  // Also hide if the timer is reset and not active
  if (!isActive && timeLeft === customTimes[mode]) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-bottom-6 duration-700">
      <div className={cn(
        "bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[40px] p-5 flex items-center gap-6 transition-all hover:scale-105",
        mode === 'work' ? "ring-2 ring-primary/20" : "ring-2 ring-accent/20"
      )}>
        <div className={cn(
          "h-14 w-14 rounded-3xl flex items-center justify-center text-white shadow-xl",
          mode === 'work' ? "bg-primary shadow-primary/20" : "bg-accent text-accent-foreground shadow-accent/20"
        )}>
          {isActive ? <Pause className="h-6 w-6 fill-current" /> : <Clock className="h-6 w-6" />}
        </div>
        
        <div className="flex flex-col pr-4 border-r border-border/50">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1.5">
            {mode === 'work' ? 'focusing' : 'resting'}
          </span>
          <span className="text-3xl font-bold font-mono tracking-tighter leading-none text-foreground tabular-nums">
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleTimer} className="h-11 w-11 rounded-2xl hover:bg-muted/50 active:scale-90 transition-transform">
            {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={resetTimer} className="h-11 w-11 rounded-2xl hover:bg-muted/50 active:scale-90 transition-transform">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="h-11 w-11 rounded-2xl hover:bg-muted/50 text-muted-foreground active:scale-90 transition-transform ml-2">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
