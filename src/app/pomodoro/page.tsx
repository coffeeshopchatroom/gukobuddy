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
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Checkbox } from "@/components/ui/checkbox"

export default function PomodoroPage() {
  const { 
    timeLeft, 
    isActive, 
    mode, 
    setMode, 
    toggleTimer, 
    resetTimer, 
    formatTime 
  } = usePomodoro();

  const { user } = useUser();
  const db = useFirestore();

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
    const total = mode === 'work' ? 1500 : mode === 'shortBreak' ? 300 : 900;
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, mode]);

  return (
    <div className="space-y-12 animate-smooth-slow pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">pomodoro timer</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">
            focus your mind, master your time.
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl border border-border">
          <Button 
            variant={mode === 'work' ? 'secondary' : 'ghost'} 
            onClick={() => setMode('work')}
            className="rounded-xl lowercase font-bold"
          >
            focus
          </Button>
          <Button 
            variant={mode === 'shortBreak' ? 'secondary' : 'ghost'} 
            onClick={() => setMode('shortBreak')}
            className="rounded-xl lowercase font-bold"
          >
            short break
          </Button>
          <Button 
            variant={mode === 'longBreak' ? 'secondary' : 'ghost'} 
            onClick={() => setMode('longBreak')}
            className="rounded-xl lowercase font-bold"
          >
            long break
          </Button>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-5 items-start">
        {/* Timer Section */}
        <Card className="lg:col-span-3 border-none shadow-2xl rounded-[48px] overflow-hidden bg-card relative">
          <div className={cn(
            "absolute inset-0 opacity-[0.03] pointer-events-none transition-colors duration-1000",
            mode === 'work' ? "bg-primary" : "bg-accent"
          )} />
          
          <CardContent className="p-16 flex flex-col items-center justify-center text-center space-y-12">
            <div className="relative w-80 h-80 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="160"
                  cy="160"
                  r="150"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <circle
                  cx="160"
                  cy="160"
                  r="150"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={942}
                  strokeDashoffset={942 - (942 * progress) / 100}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000 ease-linear",
                    mode === 'work' ? "text-primary" : "text-accent"
                  )}
                />
              </svg>
              
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-7xl md:text-8xl font-bold font-mono tracking-tighter tabular-nums leading-none">
                  {formatTime(timeLeft)}
                </span>
                <Badge variant="outline" className="mt-4 border-none text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {mode === 'work' ? <Sparkles className="h-3 w-3 mr-2" /> : <Coffee className="h-3 w-3 mr-2" />}
                  {mode.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Button 
                onClick={toggleTimer}
                className={cn(
                  "h-20 w-48 rounded-3xl text-xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 lowercase",
                  mode === 'work' ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-accent text-accent-foreground shadow-accent/20"
                )}
              >
                {isActive ? <Pause className="h-6 w-6 mr-2" /> : <Play className="h-6 w-6 mr-2" />}
                {isActive ? 'pause' : 'start'}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={resetTimer}
                className="h-20 w-20 rounded-3xl border-2 hover:bg-muted transition-all"
              >
                <RotateCcw className="h-6 w-6 text-muted-foreground" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task List Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-[40px] bg-card overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="font-headline text-2xl lowercase flex items-center justify-between">
                current tasks
                <Badge variant="secondary" className="rounded-full px-4">{tasks?.length || 0}</Badge>
              </CardTitle>
              <CardDescription className="lowercase">select a task to focus on.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              {isTasksLoading ? (
                <div className="py-10 flex justify-center">
                  <Clock className="h-8 w-8 animate-spin text-primary/30" />
                </div>
              ) : tasks && tasks.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all group cursor-pointer border border-transparent hover:border-border">
                      <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary" />
                      <span className="flex-1 font-medium lowercase truncate">{task.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto opacity-20">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground lowercase text-sm">all tasks complete!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[40px] bg-gradient-to-br from-primary/10 to-accent/10 p-8 space-y-4">
            <h3 className="font-bold lowercase flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> focus tip
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed lowercase italic">
              "focus on being productive instead of busy. the pomodoro technique helps you reclaim your deep work state."
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
