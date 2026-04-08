
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  GraduationCap, 
  ChevronRight, 
  Plus, 
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2
} from "lucide-react"

export default function TrackerPage() {
  return (
    <div className="space-y-8 animate-smooth-slow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Grade Tracker</h1>
          <p className="text-muted-foreground mt-2 text-lg">Monitor your academic performance and calculate your GPA.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105">
          <Plus className="h-5 w-5 mr-2" /> Add Course
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary/10 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary/70">Cumulative GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">3.82</span>
              <span className="text-muted-foreground">/ 4.0</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-primary mt-2 font-bold">
              <TrendingUp className="h-4 w-4" /> +0.05 from last semester
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-accent/10 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent-foreground/70">Credits Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">92</span>
              <span className="text-muted-foreground">/ 120</span>
            </div>
            <div className="w-full bg-accent/20 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-accent h-full w-[76.6%] transition-all duration-1000" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-secondary/30 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-secondary-foreground/70">Study Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">14</span>
              <span className="text-muted-foreground">Days</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Keep it up! Only 6 days to reach 20.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-headline text-2xl font-bold text-foreground px-2">Current Courses</h2>
          <div className="grid gap-4">
            <CourseCard 
              name="Calculus III" 
              code="MATH 201" 
              grade={92} 
              letter="A" 
              assignmentsCount={8} 
              examsCount={2} 
              color="bg-primary"
            />
            <CourseCard 
              name="Modern European History" 
              code="HIST 112" 
              grade={85} 
              letter="B+" 
              assignmentsCount={4} 
              examsCount={1} 
              color="bg-accent"
            />
            <CourseCard 
              name="Data Structures" 
              code="CS 202" 
              grade={78} 
              letter="C+" 
              assignmentsCount={12} 
              examsCount={3} 
              color="bg-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-bold text-foreground px-2">Upcoming Deadlines</h2>
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <DeadlineItem 
                  title="Final Project Pitch" 
                  course="CS 202" 
                  date="May 20" 
                  type="Project"
                  urgent={true}
                />
                <DeadlineItem 
                  title="Midterm Review" 
                  course="MATH 201" 
                  date="May 22" 
                  type="Exam"
                  urgent={false}
                />
                <DeadlineItem 
                  title="Renaissance Analysis" 
                  course="HIST 112" 
                  date="May 25" 
                  type="Paper"
                  urgent={false}
                />
                <DeadlineItem 
                  title="Lab 4 Submission" 
                  course="CHEM 101" 
                  date="May 28" 
                  type="Lab"
                  urgent={false}
                />
              </div>
              <Button variant="ghost" className="w-full rounded-none py-6 text-primary font-bold hover:bg-primary/5">
                View All Deadlines <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CourseCard({ name, code, grade, letter, assignmentsCount, examsCount, color }: { name: string, code: string, grade: number, letter: string, assignmentsCount: number, examsCount: number, color: string }) {
  return (
    <Card className="group border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden bg-white">
      <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 rounded-2xl ${color} opacity-20 flex items-center justify-center shrink-0`}>
            <GraduationCap className={`h-8 w-8 ${color.replace('bg-', 'text-')}`} />
          </div>
          <div className="space-y-1">
            <h3 className="font-headline text-xl font-bold text-foreground">{name}</h3>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{code}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 max-w-xs px-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
            <span className="text-muted-foreground">Current Average</span>
            <span>{grade}%</span>
          </div>
          <Progress value={grade} className="h-2 bg-muted" />
        </div>

        <div className="flex items-center gap-8 pr-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-foreground">{letter}</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Grade</p>
          </div>
          <div className="flex flex-col gap-1 text-sm font-medium">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {assignmentsCount} Assignments</span>
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent-foreground" /> {examsCount} Exams</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted ml-2">
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DeadlineItem({ title, course, date, type, urgent }: { title: string, course: string, date: string, type: string, urgent: boolean }) {
  return (
    <div className="p-6 flex items-center justify-between group hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${urgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {urgent ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </div>
        <div>
          <h4 className="font-bold text-foreground leading-tight">{title}</h4>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{course} • {type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${urgent ? 'text-destructive' : 'text-foreground'}`}>{date}</p>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Due Date</p>
      </div>
    </div>
  )
}
