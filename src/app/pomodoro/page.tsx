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
  Moon,
  ChevronRight,
  Sparkles,
  Layers,
  Settings2,
  Bell,
  Volume2,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
            <DialogContent className="rounded-[32px] border-none shadow-2xl bg-card p-10 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl lowercase">timer settings</DialogTitle>
                <DialogDescription className="lowercase">customize your session lengths (minutes).</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">focus duration</Label>
                  <Input 
                    type="number" 
                    value={tempTimes.work} 
                    onChange={e => setTempTimes(p => ({ ...p, work: parseInt(e.target.value) || 1 }))}
                    className="h-12 rounded-xl no-focus-ring bg-background border-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">short break</Label>
                    <Input 
                      type="number" 
                      value={tempTimes.shortBreak} 
                      onChange={e => setTempTimes(p => ({ ...p, shortBreak: parseInt(e.target.value) || 1 }))}
                      className="h-12 rounded-xl no-focus-ring bg-background border-muted"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">long break</Label>
                    <Input 
                      type="number" 
                      value={tempTimes.longBreak} 
                      onChange={e => setTempTimes(p => ({ ...p, longBreak: parseInt(e.target.value) || 1 }))}
                      className="h-12 rounded-xl no-focus-ring bg-background border-muted"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings} className="w-full h-14 rounded-2xl font-bold lowercase shadow-lg shadow-primary/20">apply changes</Button>
              </DialogFooter>
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
