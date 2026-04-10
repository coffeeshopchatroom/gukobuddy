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
  Plus,
  LogOut,
  UserCircle,
  LogIn
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
import { useFirebase } from "@/firebase"
import { signOut } from "firebase/auth"

const navItems = [
  {
    title: "dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "notebooks",
    url: "/notebooks",
    icon: StickyNote,
  },
  {
    title: "flashcards",
    url: "/flashcards",
    icon: Layers,
  },
  {
    title: "tracker",
    url: "/tracker",
    icon: GraduationCap,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { auth, user } = useFirebase();

  const handleSignOut = () => {
    if(auth) {
        signOut(auth);
    }
  }

  // Determine user display info
  const userName = user?.isAnonymous ? "guest" : (user?.displayName || user?.email?.split('@')[0] || "student");
  const userRole = user?.isAnonymous ? "guest session" : "member";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-6 py-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-foreground lowercase">guko buddy</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] uppercase tracking-widest font-bold opacity-30">menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-2">
              {navItems.map((item) => (
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
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-border/30">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shadow-sm">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate lowercase">{userName}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter truncate lowercase">{userRole}</span>
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
