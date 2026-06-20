
"use client"

import * as React from "react"
import { usePomodoro } from "@/components/pomodoro/pomodoro-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Coffee, 
  TrendingUp,
  ChevronRight,
  Sparkles,
  Settings2,
  Volume2,
  Loader2,
  Zap,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"

export default function PomodoroPage() {
  const { 
    timeLeft, 
    isActive, 
    mode, 
    customTimes,
    setMode, 
    toggleTimer, 
    resetTimer, 
    formatTime,
    updateCustomTime
  } = usePomodoro();

  const { user } = useUser();
  const db = useFirestore();

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [tempTimes, setTempTimes] = React.useState({
    work: customTimes.work / 60,
    shortBreak: customTimes.shortBreak / 60,
    longBreak: customTimes.longBreak / 60,
  });

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "tasks"), 
      where("completed", "==", false),
      orderBy("dueDate", "asc")
    )
  }, [db, user])

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  const progress = React.useMemo(() => {
    const total = customTimes[mode];
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, mode, customTimes]);

  const handleSaveSettings = () => {
    updateCustomTime('work', tempTimes.work);
    updateCustomTime('shortBreak', tempTimes.shortBreak);
    updateCustomTime('longBreak', tempTimes.longBreak);
    setIsSettingsOpen(false);
  };

  return (
    <div className="space-y-12 animate-smooth-slow pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">focus station</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">
            block out the noise and master your workflow.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-2 p-1.5 bg-muted/30 rounded-2xl border border-border backdrop-blur-sm">
            <TabButton active={mode === 'work'} onClick={() => setMode('work')} label="focus" />
            <TabButton active={mode === 'shortBreak'} onClick={() => setMode('shortBreak')} label="short break" />
            <TabButton active={mode === 'longBreak'} onClick={() => setMode('longBreak')} label="long break" />
          </div>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 transition-all">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] border-none shadow-3xl bg-card p-0 max-w-2xl overflow-hidden">
              <div className="flex flex-col h-full">
                <DialogHeader className="p-10 pb-0 text-left">
                  <DialogTitle className="font-headline text-3xl font-bold lowercase flex items-center gap-3">
                    <Zap className="h-7 w-7 text-primary" /> design your flow
                  </DialogTitle>
                  <DialogDescription className="lowercase text-base">adjust timers to find your perfect focus rhythm.</DialogDescription>
                </DialogHeader>

                <div className="p-10 pt-6 space-y-10">
                  {/* Focus Flow Chart */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">estimated focus trajectory</Label>
                       {tempTimes.work >= 45 && <Badge className="bg-primary/20 text-primary-foreground border-none text-[8px] font-bold lowercase">deep work mode</Badge>}
                    </div>
                    <div className="h-40 w-full bg-muted/20 rounded-3xl border border-border relative overflow-hidden p-4">
                       <FocusFlowGraph 
                        work={tempTimes.work} 
                        short={tempTimes.shortBreak} 
                        long={tempTimes.longBreak} 
                       />
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="grid gap-10">
                    <div className="space-y-5">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">focus duration</Label>
                        <span className="text-xl font-bold font-mono text-primary">{tempTimes.work}m</span>
                      </div>
                      <Slider 
                        value={[tempTimes.work]} 
                        min={5} 
                        max={90} 
                        step={5} 
                        onValueChange={v => setTempTimes(p => ({ ...p, work: v[0] }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-5">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">short break</Label>
                          <span className="text-xl font-bold font-mono text-accent-foreground">{tempTimes.shortBreak}m</span>
                        </div>
                        <Slider 
                          value={[tempTimes.shortBreak]} 
                          min={1} 
                          max={15} 
                          step={1} 
                          onValueChange={v => setTempTimes(p => ({ ...p, shortBreak: v[0] }))}
                        />
                      </div>
                      <div className="space-y-5">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">long break</Label>
                          <span className="text-xl font-bold font-mono text-indigo-500">{tempTimes.longBreak}m</span>
                        </div>
                        <Slider 
                          value={[tempTimes.longBreak]} 
                          min={5} 
                          max={45} 
                          step={5} 
                          onValueChange={v => setTempTimes(p => ({ ...p, longBreak: v[0] }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-10 pt-0">
                  <Button onClick={handleSaveSettings} className="w-full h-16 rounded-2xl text-xl font-bold lowercase shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95">
                    apply session settings
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-5 items-start">
        {/* Timer Section */}
        <Card className="lg:col-span-3 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[64px] overflow-hidden bg-card relative min-h-[600px] flex flex-col items-center justify-center">
          <div className={cn(
            "absolute inset-0 opacity-[0.05] pointer-events-none transition-colors duration-1000",
            mode === 'work' ? "bg-primary" : "bg-accent"
          )} />
          
          <CardContent className="p-16 flex flex-col items-center space-y-16 w-full relative z-10">
            <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center group">
              {/* Outer Glow */}
              <div className={cn(
                "absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-1000",
                mode === 'work' ? "bg-primary" : "bg-accent"
              )} />

              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted/10"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="289%"
                  strokeDashoffset={`${289 - (289 * progress) / 100}%`}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000 ease-linear",
                    mode === 'work' ? "text-primary" : "text-accent"
                  )}
                />
              </svg>
              
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-8xl md:text-9xl font-bold font-mono tracking-tighter tabular-nums leading-none text-foreground drop-shadow-sm">
                  {formatTime(timeLeft)}
                </span>
                <div className="mt-6 flex flex-col items-center gap-1">
                  <Badge variant="outline" className={cn(
                    "border-none text-[12px] font-bold uppercase tracking-[0.2em] px-4 py-1 rounded-full",
                    mode === 'work' ? "bg-primary/10 text-primary-foreground" : "bg-accent/10 text-accent-foreground"
                  )}>
                    {mode === 'work' ? <Sparkles className="h-3 w-3 mr-2" /> : <Coffee className="h-3 w-3 mr-2" />}
                    {mode === 'work' ? 'focus session' : mode === 'shortBreak' ? 'quick breather' : 'long rest'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 w-full max-w-sm">
              <Button 
                onClick={toggleTimer}
                className={cn(
                  "flex-1 h-20 rounded-[32px] text-2xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 lowercase",
                  mode === 'work' ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-accent text-accent-foreground shadow-accent/20"
                )}
              >
                {isActive ? <Pause className="h-8 w-8 mr-3 fill-current" /> : <Play className="h-8 w-8 mr-3 fill-current" />}
                {isActive ? 'pause' : 'start'}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={resetTimer}
                className="h-20 w-20 rounded-[32px] border-2 border-muted hover:bg-muted/50 transition-all group active:scale-95"
              >
                <RotateCcw className="h-7 w-7 text-muted-foreground group-hover:rotate-[-90deg] transition-transform duration-500" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task List Section */}
        <div className="lg:col-span-2 space-y-8 h-full">
          <Card className="border-none shadow-sm rounded-[48px] bg-card overflow-hidden flex flex-col h-full">
            <CardHeader className="p-10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-3xl lowercase">queue</CardTitle>
                  <CardDescription className="lowercase text-base">tackle these in order.</CardDescription>
                </div>
                <Badge variant="secondary" className="h-10 w-10 rounded-2xl flex items-center justify-center p-0 text-lg font-bold">
                  {tasks?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-4 flex-1 flex flex-col">
              {isTasksLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
                </div>
              ) : tasks && tasks.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {tasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="group flex items-center gap-5 p-5 rounded-[28px] bg-muted/20 hover:bg-muted/50 transition-all border border-transparent hover:border-border cursor-pointer"
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border-4 transition-colors",
                        mode === 'work' ? "border-primary/20 group-hover:bg-primary" : "border-accent/20 group-hover:bg-accent"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg lowercase truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground lowercase opacity-60">due {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-foreground transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="h-20 w-20 rounded-[32px] bg-muted/30 flex items-center justify-center opacity-40">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-xl font-bold lowercase">clear slate</p>
                    <p className="text-muted-foreground lowercase text-sm">all tasks complete for now.</p>
                  </div>
                </div>
              )}
              
              <div className="mt-10 p-8 rounded-[40px] bg-gradient-to-br from-primary/5 to-accent/5 border border-white/40 shadow-inner">
                <h3 className="font-bold lowercase flex items-center gap-2 mb-2 text-foreground/80">
                  <Volume2 className="h-4 w-4 text-primary" /> study pro-tip
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed lowercase italic">
                  "the first 10 minutes of focus are the hardest. push through the resistance to reach deep work."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FocusFlowGraph({ work, short, long }: { work: number, short: number, long: number }) {
  // Simple heuristic: 
  // Peak focus happens around 25-45 mins. 
  // Longer work times = higher initial potential but sharper fatigue curves.
  // Breaks restore potential.

  const generatePath = () => {
    const segments = 4; // Visualizing 4 cycles
    const width = 500;
    const height = 120;
    const points: string[] = ["M 0 120"];
    
    let currentX = 0;
    const totalTime = (work + short) * 3 + work + long;
    
    // Normalize focus level (0-100)
    // Rises during work, dips during break
    for (let i = 0; i < segments; i++) {
      const isLast = i === segments - 1;
      const breakTime = isLast ? long : short;
      
      // Work Segment
      const workWidth = (work / totalTime) * width;
      const peakY = Math.min(100, (work / 25) * 60 + 20); // Focus peak logic
      
      const cp1X = currentX + workWidth * 0.4;
      const cp1Y = 120 - peakY;
      const cp2X = currentX + workWidth * 0.8;
      const cp2Y = 120 - (peakY + 10);
      const endX = currentX + workWidth;
      const endY = 120 - (peakY * 0.8);
      
      points.push(`C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`);
      currentX = endX;
      
      // Break Segment
      const breakWidth = (breakTime / totalTime) * width;
      const bcp1X = currentX + breakWidth * 0.5;
      const bcp1Y = 120;
      const bendX = currentX + breakWidth;
      const bendY = 120;
      
      points.push(`Q ${bcp1X} ${bcp1Y}, ${bendX} bendY`);
      currentX = bendX;
    }

    return points.join(" ");
  };

  // Simplified Aesthetic Curve for the UI
  // Rises for work, drops for break
  const workRatio = Math.min(1, work / 60);
  const peakFocusY = 20 + workRatio * 80;
  
  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 500 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
        <defs>
          <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* The Area */}
        <path 
          d={`M 0 120 Q ${125} ${120 - peakFocusY}, ${250} ${120 - (peakFocusY * 0.5)} T 500 120 L 500 120 L 0 120`}
          fill="url(#focusGradient)"
          className="transition-all duration-700 ease-in-out"
        />

        {/* The Line */}
        <path 
          d={`M 0 120 Q ${125} ${120 - peakFocusY}, ${250} ${120 - (peakFocusY * 0.5)} T 500 120`}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          className="transition-all duration-700 ease-in-out"
        />

        {/* Peak Focus Marker */}
        <g className="transition-all duration-700 ease-in-out" style={{ transform: `translate(${125}px, ${120 - peakFocusY}px)` }}>
          <circle r="6" fill="hsl(var(--primary))" className="animate-pulse" />
          <circle r="12" fill="hsl(var(--primary))" opacity="0.2" className="animate-ping" />
          <text y="-20" textAnchor="middle" className="text-[10px] font-bold fill-primary lowercase tracking-tighter">top focus</text>
        </g>

        {/* Grid Lines */}
        <line x1="0" y1="120" x2="500" y2="120" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
      </svg>
      
      <div className="absolute top-2 left-2 flex items-center gap-1 opacity-40">
        <TrendingUp className="h-3 w-3" />
        <span className="text-[8px] font-bold uppercase tracking-widest">focus potential</span>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-xl text-sm font-bold transition-all lowercase",
        active 
          ? "bg-card text-foreground shadow-sm ring-1 ring-black/5" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {label}
    </button>
  )
}
