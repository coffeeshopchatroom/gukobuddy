
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  Layers,
  GraduationCap,
  Plus,
  LogOut,
  LogIn,
  Sparkles,
  Bell
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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, collection, query, where, orderBy } from 'firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileCustomizer } from "@/components/profile/ProfileCustomizer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { addDays, isPast, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const { auth, firestore } = useFirebase();
  const { user } = useUser();
  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'profile', 'settings') : null, [user, firestore]);
  const { data: profile } = useDoc(profileRef);

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleSignOut = () => {
    if(auth) {
        signOut(auth);
    }
  }

  const isHighSchool = profile?.studentType === 'high-school';
  const trackerLabel = isHighSchool ? "class tracker" : "course tracker";
  const focus = profile?.focus || 'all';

  const navItems = [
    { title: "dashboard", url: "/", icon: LayoutDashboard, visible: true },
    { title: "tasks", url: "/tasks", icon: CheckSquare, visible: focus === 'all' || focus === 'tasks' },
    { title: "notebooks", url: "/notebooks", icon: StickyNote, visible: focus === 'all' || focus === 'notebooks' },
    { title: "flashcards", url: "/flashcards", icon: Layers, visible: focus === 'all' || focus === 'flashcards' },
    { title: trackerLabel, url: "/tracker", icon: GraduationCap, visible: true },
  ]

  const userName = user?.isAnonymous ? "guest" : (profile?.displayName || user?.displayName || user?.email?.split('@')[0] || "student");
  const userPhoto = profile?.photoUrl || user?.photoURL || "";
  const userRole = user?.isAnonymous ? "guest session" : (isHighSchool ? "high school" : "college member");

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-6 py-8">
        <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center p-1 flex-shrink-0">
              <div className="relative w-full h-full">
                <Image src="/devmade-icons/gukologo.png" alt="guko logo" fill className="object-contain" sizes="35px" />
              </div>
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-foreground lowercase">guko buddy</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-6 mb-2">
            <SidebarGroupLabel className="p-0 text-[10px] uppercase tracking-widest font-bold opacity-30">menu</SidebarGroupLabel>
            {user && <NotificationCenter user={user} firestore={firestore} />}
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-2">
              {navItems.filter(i => i.visible).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
        ) : (
          <Button asChild className="w-full rounded-2xl py-6 font-bold gap-2 lowercase">
            <Link href="/login"><LogIn className="h-4 w-4" /> sign in</Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

function NotificationCenter({ user, firestore }: any) {
  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(
      collection(firestore, "users", user.uid, "tasks"), 
      where("completed", "==", false),
      orderBy("dueDate", "asc")
    )
  }, [user, firestore])

  const { data: tasks } = useCollection(tasksQuery)

  const upcomingTasks = React.useMemo(() => {
    if (!tasks) return []
    const now = new Date()
    const threshold = addDays(now, 2)
    return tasks.filter(t => {
      const due = parseISO(t.dueDate)
      return due <= threshold
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
            const isOverdue = isPast(parseISO(task.dueDate)) && !task.completed
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
