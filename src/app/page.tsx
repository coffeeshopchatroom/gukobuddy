
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckSquare, Layers, StickyNote, TrendingUp, ArrowRight, Plus, LogIn, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useAuth, initiateAnonymousSignIn } from "@/firebase";

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
  const auth = useAuth();

  const handleGuestSignIn = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  };

  return (
    <div className="space-y-24 animate-smooth-slow py-12">
      <section className="relative flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto p-12 rounded-[48px] overflow-hidden min-h-[600px] justify-center bg-muted/20">
        {/* background video container */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            preload="auto"
            className="w-full h-full object-cover"
          >
            {/* primary local source */}
            <source src="/hero-video.mp4" type="video/mp4" />
            {/* secondary fallback source */}
            <source src="https://cdn.pixabay.com/video/2020/09/10/49416-457333068_large.mp4" type="video/mp4" />
          </video>
          {/* overlay to ensure readability and "cool" look */}
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10 space-y-8 flex flex-col items-center">
          <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-bold bg-primary/30 text-primary-foreground border-none">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            study buddy is here
          </Badge>
          <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-[1] lowercase drop-shadow-sm">
            study better. <br /> study <span className="text-primary italic">your way.</span>
          </h1>
          <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl leading-relaxed lowercase font-medium">
            get your study life together with notes, flashcards, and simple tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild className="rounded-2xl py-8 px-10 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105">
              <Link href="/login">get started free</Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGuestSignIn}
              className="rounded-2xl py-8 px-10 text-lg font-bold border-2 transition-all hover:bg-muted bg-white/80 backdrop-blur-sm"
            >
              continue as guest
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-3">
        <FeatureCard 
          icon={<Layers className="h-6 w-6" />}
          title="active recall"
          description="turn your notes into cards and test yourself whenever."
          color="bg-primary"
        />
        <FeatureCard 
          icon={<CheckSquare className="h-6 w-6" />}
          title="smart tracking"
          description="keep track of what you actually know and what you don't."
          color="bg-accent"
        />
        <FeatureCard 
          icon={<Sparkles className="h-6 w-6" />}
          title="organized notes"
          description="keep your thoughts together with a clean digital notebook."
          color="bg-indigo-500"
        />
      </div>

      <section className="relative rounded-[48px] overflow-hidden min-h-[400px] flex items-center px-12 py-20 bg-muted/30">
        <div className="relative z-10 max-w-2xl space-y-6">
          <h2 className="font-headline text-4xl font-bold text-foreground lowercase">ready to get organized?</h2>
          <p className="text-muted-foreground text-lg leading-relaxed lowercase">
            join other students who are making their study sessions a lot less stressful.
          </p>
          <Button asChild className="rounded-xl py-6 px-8 font-bold text-lg">
            <Link href="/login">create your account <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block">
           <Image 
            src="https://picsum.photos/seed/student-minimal/600/800" 
            alt="study vibes" 
            fill 
            className="object-cover opacity-80"
            data-ai-hint="minimal student"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <Card className="border-none shadow-sm rounded-[32px] p-8 space-y-4 hover:shadow-xl transition-all group bg-white">
      <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold font-headline lowercase">{title}</h3>
      <p className="text-muted-foreground leading-relaxed lowercase">{description}</p>
    </Card>
  )
}

function DashboardPage({ user }: { user: any }) {
  const displayName = user.isAnonymous ? "guest" : (user.displayName || "student");

  return (
    <div className="space-y-8 animate-smooth-slow">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">welcome back, {displayName}!</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">you've got some tasks to look at today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-1 rounded-full text-sm font-medium">semester 2</Badge>
          <Badge variant="outline" className="px-4 py-1 rounded-full text-sm font-medium lowercase">gpa: 3.82</Badge>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-primary/10 group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">tasks</span>
            <CheckSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold lowercase">12 active</div>
            <p className="text-xs text-muted-foreground mt-1 lowercase">+2 added today</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-accent/20 group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold uppercase tracking-wider text-accent-foreground/70">flashcards</span>
            <Layers className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold lowercase">450 cards</div>
            <p className="text-xs text-muted-foreground mt-1 lowercase">across 8 decks</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-secondary/50 group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/70">notebooks</span>
            <StickyNote className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold lowercase">24 notes</div>
            <p className="text-xs text-muted-foreground mt-1 lowercase">updated recently</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-500 border-none bg-muted group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">grades</span>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold lowercase">3.82 gpa</div>
            <p className="text-xs text-muted-foreground mt-1 lowercase">target: 3.90</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden bg-white rounded-[32px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl lowercase">recent tasks</CardTitle>
              <p className="text-muted-foreground lowercase text-sm">keep track of your deadlines</p>
            </div>
            <Link href="/tasks" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium lowercase">
              view all <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "algebra midterm prep", due: "today", priority: "high", color: "destructive" },
              { title: "history essay draft", due: "tomorrow", priority: "medium", color: "default" },
              { title: "lab report: chemical bonds", due: "friday", priority: "low", color: "secondary" },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <CheckSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-foreground lowercase">{task.title}</p>
                    <p className="text-sm text-muted-foreground lowercase">due {task.due}</p>
                  </div>
                </div>
                <Badge variant={task.color as any} className="rounded-full lowercase">{task.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-primary/5 to-accent/5 rounded-[32px]">
          <CardHeader>
            <CardTitle className="font-headline text-2xl lowercase">progress</CardTitle>
            <p className="text-muted-foreground text-sm lowercase">current semester average: 88%</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium lowercase">
                <span>calculus iii</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-3 bg-white/50" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium lowercase">
                <span>modern history</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-3 bg-white/50" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium lowercase">
                <span>data structures</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-3 bg-white/50" />
            </div>
            <Link href="/tracker" className="block w-full mt-4">
              <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity lowercase">
                full analysis <TrendingUp className="h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <section className="relative rounded-[40px] overflow-hidden min-h-[300px] flex items-center px-12 py-12">
        <Image 
          src="https://picsum.photos/seed/desk-minimal/1200/400" 
          alt="focus" 
          fill 
          className="object-cover opacity-20"
          data-ai-hint="minimal workspace"
        />
        <div className="relative z-10 max-w-xl">
          <h2 className="font-headline text-3xl font-bold text-foreground lowercase">stay focused, stay ahead.</h2>
          <p className="text-muted-foreground text-lg mt-4 lowercase">
            visualize your topics or dive into your cards for a quick review session.
          </p>
          <div className="flex gap-4 mt-8">
            <Button asChild className="rounded-xl py-6 px-8 bg-accent text-accent-foreground font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-accent/20">
              <Link href="/flashcards"><Plus className="h-5 w-5" /> start studying</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl py-6 px-8 bg-white border-border text-foreground font-bold hover:bg-muted transition-colors lowercase">
              <Link href="/notebooks">explore tools</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
