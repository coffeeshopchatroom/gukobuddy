
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreVertical, Calendar as CalendarIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TasksPage() {
  return (
    <div className="space-y-8 animate-smooth-slow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Task Manager</h1>
          <p className="text-muted-foreground mt-2">Manage and prioritize your academic to-dos.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105">
          <Plus className="h-5 w-5 mr-2" /> Add New Task
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-10 border-none bg-transparent focus-visible:ring-0 shadow-none text-lg" 
            />
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl"><Filter className="h-5 w-5 text-muted-foreground" /></Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1 h-auto rounded-2xl mb-6">
            <TabsTrigger value="all" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">All Tasks</TabsTrigger>
            <TabsTrigger value="today" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">Today</TabsTrigger>
            <TabsTrigger value="upcoming" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <TaskGroup title="Current Semester" count={5}>
              <TaskItem 
                title="Prepare Calculus Lecture 4 Notes" 
                category="Calculus III" 
                priority="High" 
                dueDate="Today" 
                completed={false} 
              />
              <TaskItem 
                title="Finish History Essay Draft" 
                category="Modern History" 
                priority="Medium" 
                dueDate="Tomorrow" 
                completed={false} 
              />
              <TaskItem 
                title="Data Structures Lab 2 Submission" 
                category="CS 201" 
                priority="High" 
                dueDate="May 15" 
                completed={true} 
              />
            </TaskGroup>

            <TaskGroup title="Personal Projects" count={2}>
              <TaskItem 
                title="Website Portfolio Revamp" 
                category="Self Improvement" 
                priority="Low" 
                dueDate="June 1" 
                completed={false} 
              />
              <TaskItem 
                title="Research AI Trends" 
                category="Extracurricular" 
                priority="Medium" 
                dueDate="Next week" 
                completed={false} 
              />
            </TaskGroup>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function TaskGroup({ title, count, children }: { title: string, count: number, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <h2 className="font-headline text-xl font-bold text-foreground/80">{title}</h2>
        <Badge variant="outline" className="rounded-full bg-muted/30">{count}</Badge>
      </div>
      <div className="grid gap-3">
        {children}
      </div>
    </div>
  )
}

function TaskItem({ title, category, priority, dueDate, completed }: { title: string, category: string, priority: string, dueDate: string, completed: boolean }) {
  const priorityColor = {
    High: "bg-destructive text-destructive-foreground",
    Medium: "bg-primary text-primary-foreground",
    Low: "bg-muted text-muted-foreground",
  }[priority as 'High' | 'Medium' | 'Low']

  return (
    <Card className={`group border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl ${completed ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Checkbox checked={completed} className="h-6 w-6 rounded-lg border-primary data-[state=checked]:bg-primary" />
          <div className="space-y-1">
            <h3 className={`font-semibold text-lg leading-tight ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {title}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-primary font-medium">{category}</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> {dueDate}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={`rounded-full px-4 py-1 text-xs font-bold ${priorityColor}`}>{priority}</Badge>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
