
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Layers, StickyNote, TrendingUp, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-smooth-slow">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Welcome back, Jane!</h1>
          <p className="text-muted-foreground mt-2 text-lg">You have 4 tasks due today and 2 new flashcard decks to review.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-1 rounded-full text-sm font-medium">Semester 2</Badge>
          <Badge variant="outline" className="px-4 py-1 rounded-full text-sm font-medium">GPA: 3.82</Badge>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-primary/10 group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12 Active</div>
            <p className="text-xs text-muted-foreground mt-1">+2 added today</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-accent/20 group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-accent-foreground/70">Flashcards</CardTitle>
            <Layers className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">450 Cards</div>
            <p className="text-xs text-muted-foreground mt-1">across 8 decks</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-secondary/50 group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/70">Notebooks</CardTitle>
            <StickyNote className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24 Notes</div>
            <p className="text-xs text-muted-foreground mt-1">updated recently</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-muted group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">GPA Tracker</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.82 GPA</div>
            <p className="text-xs text-muted-foreground mt-1">target: 3.90</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">Recent Tasks</CardTitle>
              <CardDescription>Stay on top of your deadlines</CardDescription>
            </div>
            <Link href="/tasks" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Algebra Midterm Prep", due: "Today", priority: "High", color: "destructive" },
              { title: "History Essay Draft", due: "Tomorrow", priority: "Medium", color: "default" },
              { title: "Lab Report: Chemical Bonds", due: "Friday", priority: "Low", color: "secondary" },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <CheckSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <p className="text-sm text-muted-foreground">Due {task.due}</p>
                  </div>
                </div>
                <Badge variant={task.color as any} className="rounded-full">{task.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Academic Progress</CardTitle>
            <CardDescription>Current semester average: 88%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Calculus III</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-3 bg-white/50" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Modern History</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-3 bg-white/50" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Data Structures</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-3 bg-white/50" />
            </div>
            <Link href="/tracker" className="block w-full mt-4">
              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                Full Grade Analysis <TrendingUp className="h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <section className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center px-8 py-12">
        <Image 
          src="https://picsum.photos/seed/unimate-desk/1200/400" 
          alt="Focus Workspace" 
          fill 
          className="object-cover opacity-20"
          data-ai-hint="desk workspace"
        />
        <div className="relative z-10 max-w-xl">
          <h2 className="font-headline text-3xl font-bold text-foreground">Stay Focused, Stay Ahead.</h2>
          <p className="text-muted-foreground text-lg mt-4">
            Use the mind map tool to visualize complex topics or dive into your flashcard review for the daily streak.
          </p>
          <div className="flex gap-4 mt-8">
            <button className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold hover:scale-105 transition-transform flex items-center gap-2">
              <Plus className="h-5 w-5" /> Start Studying
            </button>
            <button className="px-6 py-3 rounded-xl bg-white border border-border text-foreground font-bold hover:bg-muted transition-colors">
              Explore Tools
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
