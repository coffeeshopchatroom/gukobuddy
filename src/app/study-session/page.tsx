"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Coffee, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Star, 
  Play, 
  Layers, 
  BookOpen, 
  CheckSquare, 
  Wind, 
  CloudRain, 
  Trees, 
  Volume2, 
  VolumeX,
  Maximize2,
  ChevronRight,
  Loader2,
  X,
  Layout
} from "lucide-react"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useDoc 
} from "@/firebase"
import { collection, query, orderBy, where, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { usePomodoro } from "@/components/pomodoro/pomodoro-context"
import { Progress } from "@/components/ui/progress"

type SessionTab = 'flashcards' | 'notebooks' | 'tasks'
type Soundscape = 'none' | 'white' | 'rain' | 'forest'

export default function StudySessionPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { timeLeft, isActive, toggleTimer, formatTime, mode } = usePomodoro()

  const [isSessionActive, setIsSessionActive] = React.useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState<SessionTab>('tasks')
  const [activeSound, setActiveSound] = React.useState<Soundscape>('none')
  
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const coursesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "courses"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: courses, isLoading: isCoursesLoading } = useCollection(coursesQuery)

  const toggleCourse = (id: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const startSession = () => {
    if (selectedCourseIds.length > 0) {
      setIsSessionActive(true)
    }
  }

  if (isCoursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!isSessionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
        <div className="max-w-4xl w-full space-y-8 animate-smooth-slow">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-2xl">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="font-headline text-4xl font-bold tracking-tight lowercase">configure session</h1>
              <p className="text-muted-foreground lowercase">select your focus areas for this session.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[40px] bg-card overflow-hidden">
              <CardHeader className="p-10 pb-0">
                <CardTitle className="font-headline text-2xl lowercase">select courses</CardTitle>
                <CardDescription className="lowercase">pick what you're working on today.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-6 space-y-4">
                {courses && courses.length > 0 ? (
                  <div className="grid gap-3">
                    {courses.map(course => (
                      <button
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={cn(
                          "flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left group",
                          selectedCourseIds.includes(course.id)
                            ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                            : "border-muted hover:border-muted-foreground/20"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                            selectedCourseIds.includes(course.id) ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold lowercase leading-tight">{course.name}</p>
                            <p className="text-xs text-muted-foreground lowercase">{course.code || 'general'}</p>
                          </div>
                        </div>
                        {selectedCourseIds.includes(course.id) && <Star className="h-4 w-4 text-primary fill-current" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground lowercase italic border-2 border-dashed rounded-[32px]">
                    no courses found. add some in the tracker first!
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[40px] bg-card/60 backdrop-blur-sm p-10 space-y-8">
                <div className="space-y-4 text-center">
                  <div className="h-20 w-20 rounded-[32px] bg-accent/10 flex items-center justify-center mx-auto text-accent-foreground animate-float">
                    <Coffee className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold font-headline lowercase">session ready?</h3>
                  <p className="text-muted-foreground lowercase text-sm">
                    starting will hide all standard app navigation to help you stay in the flow.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60 ml-2">
                    <span>current focus mode</span>
                    <span>{mode === 'work' ? 'pomodoro focus' : 'on break'}</span>
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/40 border flex items-center justify-between">
                     <span className="text-3xl font-bold font-mono tracking-tighter">{formatTime(timeLeft)}</span>
                     <Badge variant="outline" className="rounded-full bg-background border-none px-4 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                       deep work active
                     </Badge>
                  </div>
                </div>

                <Button 
                  disabled={selectedCourseIds.length === 0}
                  onClick={startSession}
                  className="w-full h-20 rounded-[32px] text-2xl font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-all lowercase"
                >
                  <Play className="h-6 w-6 mr-3 fill-current" /> start study session
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#f9f9f9] flex flex-col z-[9999] overflow-hidden">
      {/* Session Header */}
      <header className="h-20 bg-white border-b border-border/10 flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden p-1.5">
               <img src="/devmade-icons/gukologo.png" className="w-full h-full object-contain" alt="" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg leading-none lowercase">study session</h2>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {selectedCourseIds.length} course{selectedCourseIds.length > 1 ? 's' : ''} active
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-border/40" />

          <nav className="flex gap-2 p-1 bg-muted/30 rounded-2xl border border-border/40">
            <SessionTabBtn active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={16} />} label="tasks" />
            <SessionTabBtn active={activeTab === 'notebooks'} onClick={() => setActiveTab('notebooks')} icon={<BookOpen size={16} />} label="notebooks" />
            <SessionTabBtn active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={<Layers size={16} />} label="flashcards" />
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* Zen Controls */}
          <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl border border-border/40">
             <ZenToggle active={activeSound === 'white'} onClick={() => setActiveSound(activeSound === 'white' ? 'none' : 'white')} icon={<Wind size={16} />} />
             <ZenToggle active={activeSound === 'rain'} onClick={() => setActiveSound(activeSound === 'rain' ? 'none' : 'rain')} icon={<CloudRain size={16} />} />
             <ZenToggle active={activeSound === 'forest'} onClick={() => setActiveSound(activeSound === 'forest' ? 'none' : 'forest')} icon={<Trees size={16} />} />
             <div className="w-px h-4 bg-border/40 mx-1" />
             <div className="px-3 flex items-center gap-2">
                {activeSound !== 'none' ? <Volume2 size={16} className="text-primary animate-pulse" /> : <VolumeX size={16} className="text-muted-foreground/30" />}
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">zen mode</span>
             </div>
          </div>

          <div className="flex items-center gap-4 pl-6 border-l border-border/40">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary leading-none mb-1">{mode === 'work' ? 'focusing' : 'on break'}</span>
              <span className="text-2xl font-bold font-mono tracking-tighter leading-none tabular-nums">{formatTime(timeLeft)}</span>
            </div>
            <Button size="icon" onClick={toggleTimer} className={cn("h-12 w-12 rounded-2xl shadow-lg", mode === 'work' ? "bg-primary" : "bg-accent")}>
              {isActive ? <X className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
            </Button>
          </div>

          <Button variant="ghost" onClick={() => setIsSessionActive(false)} className="rounded-xl h-10 px-4 ml-4 text-muted-foreground hover:text-foreground lowercase">
            end session
          </Button>
        </div>
      </header>

      {/* Main Study Area */}
      <main className="flex-1 flex overflow-hidden relative">
         <div className="flex-1 bg-muted/10 p-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
               {activeTab === 'tasks' && <SessionTasks courseIds={selectedCourseIds} user={user} db={db} />}
               {activeTab === 'notebooks' && <SessionNotebooks courseIds={selectedCourseIds} user={user} db={db} />}
               {activeTab === 'flashcards' && <SessionFlashcards courseIds={selectedCourseIds} user={user} db={db} />}
            </div>
         </div>

         {/* Right Control Bar (Optional extra context) */}
         <aside className="w-80 bg-white border-l border-border/10 p-8 flex flex-col gap-8 hidden xl:flex">
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">session progress</h3>
               <div className="space-y-4 bg-muted/20 p-6 rounded-[32px] border border-border/40">
                  <div className="flex justify-between items-center text-xs font-bold lowercase">
                    <span>flow capacity</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2 bg-background rounded-full" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed lowercase">
                    you've been in high focus for 42 minutes. keep it up!
                  </p>
               </div>
            </div>

            <div className="mt-auto p-6 rounded-[32px] bg-primary/5 border border-primary/10">
               <Sparkles className="h-6 w-6 text-primary mb-3" />
               <p className="text-xs font-medium text-foreground lowercase leading-relaxed">
                 "the secret of getting ahead is getting started."
               </p>
            </div>
         </aside>
      </main>

      {/* Audio elements for Zen Mode */}
      {activeSound === 'white' && <audio src="https://assets.mixkit.co/sfx/preview/mixkit-static-hum-2495.mp3" autoPlay loop className="hidden" />}
      {activeSound === 'rain' && <audio src="https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3" autoPlay loop className="hidden" />}
      {activeSound === 'forest' && <audio src="https://assets.mixkit.co/sfx/preview/mixkit-soft-wind-in-the-forest-loop-2401.mp3" autoPlay loop className="hidden" />}
    </div>
  )
}

function SessionTabBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all lowercase",
        active 
          ? "bg-white text-foreground shadow-sm ring-1 ring-black/5" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: active ? "text-primary" : "opacity-40" })}
      {label}
    </button>
  )
}

function ZenToggle({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
        active ? "bg-primary text-primary-foreground shadow-md scale-110" : "hover:bg-muted text-muted-foreground/40"
      )}
    >
      {icon}
    </button>
  )
}

function SessionTasks({ courseIds, user, db }: any) {
  const queryRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db, "users", user.uid, "tasks"), 
      where("completed", "==", false),
      orderBy("dueDate", "asc")
    )
  }, [user, db])
  const { data: tasks } = useCollection(queryRef)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-headline font-bold lowercase">active queue</h2>
        <Badge variant="secondary" className="px-4 py-1 rounded-full text-xs font-bold lowercase">
          {tasks?.length || 0} items remaining
        </Badge>
      </div>

      <div className="grid gap-4">
        {tasks && tasks.length > 0 ? (
          tasks.map(task => (
            <Card key={task.id} className="border-none shadow-sm rounded-3xl bg-white p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-6">
                <div className="h-5 w-5 rounded-full border-2 border-primary/20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xl lowercase leading-tight">{task.title}</h4>
                  <p className="text-xs text-muted-foreground lowercase mt-0.5">due {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <Badge className={cn(
                  "rounded-full px-4 text-[10px] font-bold uppercase tracking-widest",
                  task.priority === 'high' ? "bg-destructive text-white" : "bg-primary/20 text-primary-foreground"
                )}>
                  {task.priority}
                </Badge>
              </div>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <CheckSquare className="h-12 w-12 text-muted-foreground/10 mx-auto" />
            <p className="text-muted-foreground lowercase font-medium">all clear! nothing in your queue.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SessionNotebooks({ courseIds, user, db }: any) {
  const queryRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "users", user.uid, "notes"), orderBy("updatedAt", "desc"))
  }, [user, db])
  const { data: notes } = useCollection(queryRef)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-headline font-bold lowercase">study notes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes && notes.length > 0 ? (
          notes.map(note => (
            <Card key={note.id} className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-500">
               <div className="h-32 bg-muted/10 relative overflow-hidden">
                  {note.coverImage && <img src={note.coverImage} className="w-full h-full object-cover" alt="" />}
               </div>
               <div className="p-6 space-y-2">
                  <div className="text-2xl mb-2">{note.icon || '📄'}</div>
                  <h4 className="font-bold text-lg lowercase truncate">{note.title || 'untitled'}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    last edited {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
               </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground/10 mx-auto" />
            <p className="text-muted-foreground lowercase font-medium">no notes found for these courses.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SessionFlashcards({ courseIds, user, db }: any) {
  // Simplification: In a real app we'd fetch sets linked to the selected course IDs
  // For the MVP session, we'll fetch all sets to show availability
  const queryRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "temp")) // Placeholder for more complex set discovery
  }, [user, db])
  const { data: sets } = useCollection(queryRef)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-headline font-bold lowercase">flashcard decks</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[1,2,3].map(i => (
           <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white p-8 flex flex-col items-center justify-center gap-4 text-center">
              <div className="h-16 w-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary">
                 <Layers className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-bold lowercase">sample deck {i}</h4>
                <p className="text-xs text-muted-foreground lowercase">15 cards ready</p>
              </div>
              <Button size="sm" className="rounded-xl px-6 lowercase font-bold">study</Button>
           </Card>
         ))}
      </div>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </div>
  )
}
