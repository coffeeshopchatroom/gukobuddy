"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  Layers,
  GraduationCap,
  LogOut,
  LogIn,
  Shield,
  Terminal,
  Clock,
  Coffee,
  ChevronDown,
  Brain,
  Palette,
  ClipboardCheck,
  Bell,
  Radio
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, collection, query, orderBy } from 'firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileCustomizer } from "@/components/profile/ProfileCustomizer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { addDays, isPast, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function AppSidebar() {
  const pathname = usePathname()
  const { auth, firestore } = useFirebase();
  const { user } = useUser();
  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'profile', 'settings') : null, [user, firestore]);
  const { data: profile } = useDoc(profileRef);

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = React.useState(false);
  
  const isTaskRelated = pathname.startsWith('/tasks') || pathname === '/pomodoro' || pathname === '/study-session';
  const isNotebookRelated = pathname.startsWith('/notebooks');
  const isFlashcardRelated = pathname.startsWith('/flashcards');

  const [isTasksOpen, setIsTasksOpen] = React.useState(isTaskRelated);
  const [isNotebooksOpen, setIsNotebooksOpen] = React.useState(isNotebookRelated);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = React.useState(isFlashcardRelated);

  React.useEffect(() => {
    if (isTaskRelated) setIsTasksOpen(true);
    if (isNotebookRelated) setIsNotebooksOpen(true);
    if (isFlashcardRelated) setIsFlashcardsOpen(true);
  }, [pathname, isTaskRelated, isNotebookRelated, isFlashcardRelated]);

  const handleSignOut = () => {
    if(auth) {
        signOut(auth);
    }
  }

  const isHighSchool = profile?.studentType === 'high-school';
  const trackerLabel = isHighSchool ? "class tracker" : "course tracker";
  const focus = profile?.focus || 'all';

  const userName = user?.isAnonymous ? "guest" : (profile?.displayName || user?.displayName || user?.email?.split('@')[0] || "student");
  const userPhoto = profile?.photoUrl || user?.photoURL || "";
  const userRole = user?.isAnonymous ? "guest session" : (isHighSchool ? "high school" : "college member");
  const isAdmin = profile?.isAdmin === true;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-6 py-8">
        <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
              <img 
                src="/devmade-icons/gukologo.png" 
                alt="guko logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-foreground lowercase">guko buddy</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-6 mb-2">
            <SidebarGroupLabel className="p-0 text-[10px] uppercase tracking-widest font-bold opacity-30">menu</SidebarGroupLabel>
            {user && !user.isAnonymous && <NotificationCenter user={user} firestore={firestore} />}
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/channel"}
                  tooltip="guko channel"
                  className="flex items-center gap-3 px-4 py-7 rounded-2xl transition-all duration-300 bg-primary/10 text-primary hover:bg-primary/20 mb-4 border border-primary/20 shadow-sm lowercase"
                >
                  <Link href="/channel">
                    <Radio className="h-6 w-6 animate-pulse" />
                    <span className="font-bold text-base">guko channel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="dashboard"
                  className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase"
                >
                  <Link href="/">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium">dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {(focus === 'all' || focus === 'tasks') && (
                <Collapsible 
                  open={isTasksOpen} 
                  onOpenChange={setIsTasksOpen}
                  onMouseEnter={() => setIsTasksOpen(true)}
                  onMouseLeave={() => !isTaskRelated && setIsTasksOpen(false)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.startsWith('/tasks')}
                        tooltip="tasks"
                        className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase"
                      >
                        <CheckSquare className="h-5 w-5" />
                        <span className="font-medium">tasks</span>
                        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-300", isTasksOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <SidebarMenuSub className="py-1">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/tasks'}>
                            <Link href="/tasks">
                              <span className="lowercase">all tasks</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/pomodoro'}>
                            <Link href="/pomodoro">
                              <span className="flex items-center gap-2 lowercase">
                                <Clock className="h-3 w-3" /> pomodoro
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/study-session'}>
                            <Link href="/study-session">
                              <span className="flex items-center gap-2 lowercase">
                                <Coffee className="h-3 w-3" /> study session
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {(focus === 'all' || focus === 'notebooks') && (
                <Collapsible 
                  open={isNotebooksOpen} 
                  onOpenChange={setIsNotebooksOpen}
                  onMouseEnter={() => setIsNotebooksOpen(true)}
                  onMouseLeave={() => !isNotebookRelated && setIsNotebooksOpen(false)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname === "/notebooks"}
                        tooltip="notebooks"
                        className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase"
                      >
                        <StickyNote className="h-5 w-5" />
                        <span className="font-medium">notebooks</span>
                        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-300", isNotebooksOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <SidebarMenuSub className="py-1">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/notebooks'}>
                            <Link href="/notebooks">
                              <span className="lowercase">all notes</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/notebooks/mind-maps'}>
                            <Link href="/notebooks/mind-maps">
                              <span className="flex items-center gap-2 lowercase">
                                <Brain className="h-3 w-3" /> mind maps
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/notebooks/whiteboard'}>
                            <Link href="/notebooks/whiteboard">
                              <span className="flex items-center gap-2 lowercase">
                                <Palette className="h-3 w-3" /> whiteboard
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {(focus === 'all' || focus === 'flashcards') && (
                <Collapsible 
                  open={isFlashcardsOpen} 
                  onOpenChange={setIsFlashcardsOpen}
                  onMouseEnter={() => setIsFlashcardsOpen(true)}
                  onMouseLeave={() => !isFlashcardRelated && setIsFlashcardsOpen(false)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname === "/flashcards"}
                        tooltip="flashcards"
                        className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase"
                      >
                        <Layers className="h-5 w-5" />
                        <span className="font-medium">flashcards</span>
                        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-300", isFlashcardsOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <SidebarMenuSub className="py-1">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/flashcards'}>
                            <Link href="/flashcards">
                              <span className="lowercase">all decks</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/flashcards/quiz'}>
                            <Link href="/flashcards/quiz">
                              <span className="flex items-center gap-2 lowercase">
                                <ClipboardCheck className="h-3 w-3" /> create quiz
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/tracker"}
                  tooltip={trackerLabel}
                  className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase"
                >
                  <Link href="/tracker">
                    <GraduationCap className="h-5 w-5" />
                    <span className="font-medium">{trackerLabel}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4">
        {user && (
          <SidebarMenu className="px-0 py-0">
              <SidebarMenuItem>
                  <SidebarMenuButton
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-destructive/10 hover:text-destructive group lowercase"
                  >
                      <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-destructive" />
                      <span className="font-medium">sign out</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        )}

        {user ? (
          <div className="flex flex-col gap-2 p-1">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ProfileCustomizer open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <div 
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-border/30 hover:bg-secondary/70 transition-all group cursor-pointer"
                  >
                    <Avatar className="h-9 w-9 border border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                      <AvatarImage src={userPhoto} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate lowercase">{userName}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter truncate lowercase">{userRole}</span>
                    </div>
                  </div>
                </ProfileCustomizer>
              </div>

              {isAdmin && (
                <AdminPanelDialog open={isAdminPanelOpen} onOpenChange={setIsAdminPanelOpen}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                  >
                    <Shield className="h-5 w-5" />
                  </Button>
                </AdminPanelDialog>
              )}
            </div>
          </div>
        ) : (
          <Button asChild className="w-full rounded-2xl py-6 font-bold gap-2 lowercase">
            <Link href="/login"><LogIn className="h-4 w-4" /> sign in</Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminPanelDialog({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast()

  const handleTestNotification = () => {
    if (!("Notification" in window)) {
      toast({
        variant: "destructive",
        title: "unsupported",
        description: "browser doesn't support notifications."
      })
      return
    }

    if (Notification.permission === "granted") {
      new Notification("guko admin: test alert", {
        body: "this is a test notification to verify your system is working. good job!",
        icon: "/devmade-icons/gukologo.png",
      })
      toast({
        title: "test sent",
        description: "check your desktop for the notification."
      })
    } else {
      toast({
        variant: "destructive",
        title: "permission required",
        description: "please enable notifications in task settings first."
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="rounded-[32px] border-none shadow-2xl sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-2 lowercase">
            <Shield className="h-6 w-6 text-primary" /> admin controls
          </DialogTitle>
          <DialogDescription className="lowercase">
            internal tools for guko buddy developers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">system diagnostics</h4>
            <Button 
              onClick={handleTestNotification}
              className="w-full h-14 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/10 lowercase"
            >
              <Terminal className="h-5 w-5" /> test task notification
            </Button>
            <p className="text-xs text-muted-foreground text-center lowercase px-4">
              this will trigger an immediate native browser notification if permissions are granted.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NotificationCenter({ user, firestore }: any) {
  // Use simple query to avoid index errors
  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(
      collection(firestore, "users", user.uid, "tasks"), 
      orderBy("dueDate", "asc")
    )
  }, [user, firestore])

  const { data: tasks } = useCollection(tasksQuery)

  const upcomingTasks = React.useMemo(() => {
    if (!tasks) return []
    const now = new Date()
    const threshold = addDays(now, 2)
    // Filter for incomplete tasks in memory
    return tasks.filter(t => {
      const due = parseISO(t.dueDate)
      return !t.completed && due <= threshold
    })
  }, [tasks])

  if (upcomingTasks.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1 hover:bg-muted rounded-full transition-colors group">
          <Bell className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-white flex items-center justify-center">
            <span className="sr-only">new notifications</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-3xl border-none shadow-2xl bg-white overflow-hidden" align="start" side="right" sideOffset={10}>
        <div className="p-6 bg-primary/10 border-b">
          <h3 className="font-headline font-bold text-lg lowercase">upcoming deadlines</h3>
          <p className="text-xs text-muted-foreground lowercase">tasks due within 48 hours.</p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {upcomingTasks.map((task) => {
            const isOverdue = isPast(parseISO(task.dueDate))
            return (
              <div key={task.id} className="p-4 border-b last:border-0 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                <div className={cn(
                  "mt-1 h-2 w-2 rounded-full shrink-0",
                  isOverdue ? "bg-destructive" : "bg-primary"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm lowercase truncate">{task.title}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {isOverdue ? "overdue" : "due soon"}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-4 bg-muted/20 text-center">
          <Link href="/tasks" className="text-xs font-bold text-primary hover:underline lowercase">
            view task manager
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
