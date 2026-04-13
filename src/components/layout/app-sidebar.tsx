
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
  UserCircle,
  LogIn,
  Sparkles
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
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc } from 'firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileCustomizer } from "@/components/profile/ProfileCustomizer"

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
    {
      title: "dashboard",
      url: "/",
      icon: LayoutDashboard,
      visible: true
    },
    {
      title: "tasks",
      url: "/tasks",
      icon: CheckSquare,
      visible: focus === 'all' || focus === 'tasks'
    },
    {
      title: "notebooks",
      url: "/notebooks",
      icon: StickyNote,
      visible: focus === 'all' || focus === 'notebooks'
    },
    {
      title: "flashcards",
      url: "/flashcards",
      icon: Layers,
      visible: focus === 'all' || focus === 'flashcards'
    },
    {
      title: trackerLabel,
      url: "/tracker",
      icon: GraduationCap,
      visible: true
    },
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
          <SidebarGroupLabel className="px-6 text-[10px] uppercase tracking-widest font-bold opacity-30">menu</SidebarGroupLabel>
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
        
        {(focus === 'all' || focus === 'notebooks') && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-6 text-[10px] uppercase tracking-widest font-bold opacity-30">actions</SidebarGroupLabel>
            <SidebarMenu className="px-4 py-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="flex items-center gap-3 px-4 py-6 rounded-xl text-muted-foreground hover:bg-accent/50 transition-colors lowercase">
                  <Link href="/notebooks">
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">new note</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
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
            {profile?.useAi && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">smart mode active</span>
              </div>
            )}
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
