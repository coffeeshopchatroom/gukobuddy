"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar as CalendarIcon, 
  Trash2, 
  Loader2,
  Clock,
  AlertCircle,
  BellRing
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format, isToday, isFuture, isPast, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function TasksPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission>('default')

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "unsupported browser",
        description: "your browser doesn't support desktop notifications."
      })
      return
    }

    const result = await Notification.requestPermission()
    setNotificationPermission(result)
    
    if (result === 'granted') {
      toast({
        title: "notifications enabled",
        description: "you'll now receive desktop alerts for upcoming tasks."
      })
    } else if (result === 'denied') {
      toast({
        variant: "destructive",
        title: "notifications blocked",
        description: "please enable notifications in your browser settings."
      })
    }
  }

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "tasks"), orderBy("dueDate", "asc"))
  }, [db, user])

  const { data: tasks, isLoading } = useCollection(tasksQuery)

  const filteredTasks = React.useMemo(() => {
    if (!tasks) return []
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tasks, searchTerm])

  const handleToggleTask = (taskId: string, currentStatus: boolean) => {
    if (!user || !db) return
    const taskRef = doc(db, "users", user.uid, "tasks", taskId)
    updateDocumentNonBlocking(taskRef, { completed: !currentStatus })
  }

  const handleDeleteTask = (taskId: string) => {
    if (!user || !db) return
    const taskRef = doc(db, "users", user.uid, "tasks", taskId)
    deleteDocumentNonBlocking(taskRef)
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-smooth-slow pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">task manager</h1>
          <p className="text-muted-foreground mt-2 lowercase text-lg">manage and prioritize your academic to-dos.</p>
        </div>
        <div className="flex gap-3">
          {user && !user.isAnonymous && notificationPermission !== 'granted' && (
            <Button 
              variant="outline" 
              onClick={handleRequestPermission}
              className="border-2 font-bold py-6 px-8 rounded-2xl shadow-sm transition-all hover:bg-primary/5 lowercase group"
            >
              <BellRing className="h-5 w-5 mr-2 group-hover:animate-bounce" /> enable desktop alerts
            </Button>
          )}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105 lowercase">
                <Plus className="h-5 w-5 mr-2" /> add new task
              </Button>
            </DialogTrigger>
            <AddTaskDialog user={user} db={db} onClose={() => setIsAddOpen(false)} />
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 border-none bg-transparent focus-visible:ring-0 shadow-none text-lg lowercase" 
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1 h-auto rounded-2xl mb-6">
            <TabsTrigger value="all" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium lowercase">all</TabsTrigger>
            <TabsTrigger value="today" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium lowercase">today</TabsTrigger>
            <TabsTrigger value="upcoming" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium lowercase">upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium lowercase">completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            <TaskSection 
              title="active tasks" 
              tasks={filteredTasks.filter(t => !t.completed)} 
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              isLoading={isLoading}
            />
            <TaskSection 
              title="completed" 
              tasks={filteredTasks.filter(t => t.completed)} 
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="today">
            <TaskSection 
              title="due today" 
              tasks={filteredTasks.filter(t => !t.completed && isToday(parseISO(t.dueDate)))} 
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="upcoming">
            <TaskSection 
              title="future deadlines" 
              tasks={filteredTasks.filter(t => !t.completed && isFuture(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)))} 
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="completed">
            <TaskSection 
              title="archived" 
              tasks={filteredTasks.filter(t => t.completed)} 
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function TaskSection({ title, tasks, onToggle, onDelete, isLoading }: any) {
  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (tasks.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="font-headline text-xl font-bold text-foreground/80 px-2 lowercase">{title}</h2>
      <div className="grid gap-3">
        {tasks.map((task: any) => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onToggle={() => onToggle(task.id, task.completed)} 
            onDelete={() => onDelete(task.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete }: any) {
  const priorityColor = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-primary text-primary-foreground",
    low: "bg-muted text-muted-foreground",
  }[task.priority as 'high' | 'medium' | 'low']

  const isOverdue = !task.completed && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate))
  const dueDate = parseISO(task.dueDate)

  return (
    <Card className={cn(
      "group border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-[24px] overflow-hidden bg-white",
      task.completed && "opacity-60"
    )}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Checkbox 
            checked={task.completed} 
            onCheckedChange={onToggle}
            className="h-6 w-6 rounded-lg border-primary data-[state=checked]:bg-primary" 
          />
          <div className="space-y-1">
            <h3 className={cn(
              "font-bold text-xl leading-tight lowercase",
              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
            )}>
              {task.title}
            </h3>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className={cn(
                "flex items-center gap-1.5 lowercase",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}>
                {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <CalendarIcon className="h-3.5 w-3.5" />}
                {isToday(dueDate) ? 'today' : format(dueDate, 'MMM d')}
              </span>
              {task.description && (
                <span className="text-muted-foreground opacity-60 lowercase truncate max-w-[200px]">
                  {task.description}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={cn("rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest", priorityColor)}>
            {task.priority}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AddTaskDialog({ user, db, onClose }: any) {
  const [title, setTitle] = React.useState("")
  const [priority, setPriority] = React.useState("medium")
  const [dueDate, setDueDate] = React.useState(format(new Date(), 'yyyy-MM-dd'))

  const handleAdd = () => {
    if (!user || !db || !title) return
    const taskId = doc(collection(db, "temp")).id
    const taskRef = doc(db, "users", user.uid, "tasks", taskId)
    
    setDocumentNonBlocking(taskRef, {
      id: taskId,
      title,
      priority,
      dueDate: new Date(dueDate).toISOString(),
      completed: false,
      createdAt: new Date().toISOString()
    }, { merge: true })
    
    onClose()
  }

  return (
    <DialogContent className="rounded-[32px] border-none shadow-2xl">
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl lowercase">new academic task</DialogTitle>
        <DialogDescription className="lowercase">add a deadline or to-do to your manager.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4">
        <div className="space-y-2">
          <Label className="lowercase ml-1">task title</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. review calculus chapter 4" 
            className="rounded-xl h-12 lowercase" 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="lowercase ml-1">due date</Label>
            <Input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className="rounded-xl h-12 lowercase" 
            />
          </div>
          <div className="space-y-2">
            <Label className="lowercase ml-1">priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="rounded-xl h-12 lowercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="high">high</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} className="rounded-xl lowercase font-bold">cancel</Button>
        <Button onClick={handleAdd} disabled={!title} className="rounded-xl bg-primary text-primary-foreground font-bold px-8 lowercase">add task</Button>
      </DialogFooter>
    </DialogContent>
  )
}
