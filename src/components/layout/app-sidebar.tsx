
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
  Settings,
  Plus
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

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Notebooks",
    url: "/notebooks",
    icon: StickyNote,
  },
  {
    title: "Flashcards",
    url: "/flashcards",
    icon: Layers,
  },
  {
    title: "Grade Tracker",
    url: "/tracker",
    icon: GraduationCap,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-6 py-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-foreground">UniMate</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-xs uppercase tracking-widest font-semibold opacity-50">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
          <SidebarGroupLabel className="px-6 text-xs uppercase tracking-widest font-semibold opacity-50">Quick Actions</SidebarGroupLabel>
          <SidebarMenu className="px-4 py-2">
            <SidebarMenuItem>
              <SidebarMenuButton className="flex items-center gap-3 px-4 py-6 rounded-xl text-muted-foreground hover:bg-accent/50">
                <Plus className="h-5 w-5" />
                <span className="font-medium">New Note</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">JD</div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Jane Doe</span>
            <span className="text-xs text-muted-foreground">Computer Science</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
