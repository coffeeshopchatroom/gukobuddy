
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckSquare, Layers, StickyNote, TrendingUp, ArrowRight, Plus, LogIn, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/firebase";

export default function Page() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GraduationCap className="h-12 w-12 animate-pulse text-primary/40" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <DashboardPage user={user} />;
}

function LandingPage() {
  return (
    <div className="space-y-24 animate-smooth-slow py-12">
      <section className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
        <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-bold bg-primary/10 text-primary uppercase tracking-widest border-none">
          <Sparkles className="h-3.5 w-3.5 mr-2" />
          The future of studying is here
        </Badge>
        <h1 className="font-headline text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
          Study better. <br /> Study <span className="text-primary italic">your way.</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl leading-relaxed">
          Master any subject with AI-powered quizzes, dynamic matching games, and active recall tracking.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button asChild className="rounded-2xl py-8 px-10 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105">
            <Link href="/login">Get Started for Free</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-2xl py-8 px-10 text-lg font-bold border-2 transition-all hover:bg-muted">
            <Link href="/login">Continue as Guest</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-3">
        <FeatureCard 
          icon={<Layers className="h-6 w-6" />}
          title="Active Recall"
          description="Transform notes into flashcards with automated quiz generation."
          color="bg-primary"
        />
        <FeatureCard 
          icon={<CheckSquare className="h-6 w-6" />}
          title="Smart Tracking"
          description="Identify your weak spots and master them through focused repetition."
          color="bg-accent"
        />
        <FeatureCard 
          icon={<Sparkles className="h-6 w-6" />}
          title="AI Evaluation"
          description="Get semantic feedback on your open-ended answers, not just keyword matches."
          color="bg-indigo-500"
        />
      </div>

      <section className="relative rounded-[48px] overflow-hidden min-h-[400px] flex items-center px-12 py-20 bg-muted/30">
        <div className="relative z-10 max-w-2xl space-y-6">
          <h2 className="font-headline text-4xl font-bold text-foreground">Ready to ace your next exam?</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Join thousands of students who have organized their academic life and boosted their grades using our intuitive workspace.
          </p>
          <Button asChild className="rounded-xl py-6 px-8 font-bold text-lg">
            <Link href="/login">Create Your Account <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block">
           <Image 
            src="https://picsum.photos/seed/landing-hero/600/800" 
            alt="Product Preview" 
            fill 
            className="object-cover opacity-80"
            data-ai-hint="student aesthetic"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <Card className="border-none shadow-sm rounded-[32px] p-8 space-y-4 hover:shadow-xl transition-all group">
      <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold font-headline">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  )
}

function DashboardPage({ user }: { user: any }) {
  const displayName = user.isAnonymous ? "Guest User" : (user.displayName || "Student");

  return (
    <div className="space-y-8 animate-smooth-slow">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Welcome back, {displayName}!</h1>
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
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden bg-white rounded-[32px]">
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

        <Card className="lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-primary/5 to-accent/5 rounded-[32px]">
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
      
      <section className="relative rounded-[40px] overflow-hidden min-h-[300px] flex items-center px-12 py-12">
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
            <Button asChild className="rounded-xl py-6 px-8 bg-accent text-accent-foreground font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-accent/20">
              <Link href="/flashcards"><Plus className="h-5 w-5" /> Start Studying</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl py-6 px-8 bg-white border-border text-foreground font-bold hover:bg-muted transition-colors">
              <Link href="/notebooks">Explore Tools</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
