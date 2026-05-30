
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckSquare, 
  Layers, 
  StickyNote, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  GraduationCap, 
  Clock, 
  AlertCircle,
  Radio,
  Zap,
  BookOpen,
  Calendar,
  Flame,
  MousePointer2
} from "lucide-react";
import Link from "next/link";
import { useUser, useAuth, initiateAnonymousSignIn, useDoc, useFirestore, useMemoFirebase, useCollection, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy } from 'firebase/firestore';
import * as React from 'react';
import { format, isToday, parseISO } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function Page() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GraduationCap className="h-12 w-12 animate-pulse text-primary/40" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <DashboardPage user={user} profile={profile} profileRef={profileRef} />;
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
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover"
          >
            <source src="https://cdn.pixabay.com/video/2020/09/10/49416-457333068_large.mp4" type="video/mp4" />
          </video>
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
              <Link href="/signup">get started free</Link>
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

function DashboardPage({ user, profile, profileRef }: { user: any, profile?: any, profileRef: any }) {
  const db = useFirestore();
  const isHighSchool = profile?.studentType === 'high-school';
  const isHobbyist = profile?.studentType === 'hobbyist';
  
  const categoryLabel = isHobbyist ? "interests" : (isHighSchool ? "classes" : "courses");
  const focus = profile?.focus || 'all';

  // Use simple queries
  const tasksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "tasks"), orderBy("dueDate", "asc"));
  }, [db, user]);
  const { data: allTasks } = useCollection(tasksQuery);

  const coursesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "courses"), orderBy("createdAt", "desc"));
  }, [db, user]);
  const { data: courses } = useCollection(coursesQuery);

  const activeTasks = React.useMemo(() => allTasks?.filter(t => !t.completed) || [], [allTasks]);
  const recentTasks = React.useMemo(() => activeTasks.slice(0, 3), [activeTasks]);

  // Sticky note handler
  const [stickyNote, setStickyNote] = React.useState(profile?.stickyNote || "");
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (profile?.stickyNote !== undefined) {
      setStickyNote(profile.stickyNote);
    }
  }, [profile?.stickyNote]);

  const handleStickyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setStickyNote(val);
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      if (profileRef) {
        updateDocumentNonBlocking(profileRef, { stickyNote: val });
      }
    }, 1000);
  };

  // Calculations
  const gpa = React.useMemo(() => {
    if (!courses || courses.length === 0) return "0.00";
    const points: Record<string, number> = {
      'a+': 4.0, 'a': 4.0, 'a-': 3.7,
      'b+': 3.3, 'b': 3.0, 'b-': 2.7,
      'c+': 2.3, 'c': 2.0, 'c-': 1.7,
      'd+': 1.3, 'd': 1.0, 'f': 0.0
    }
    const totalPoints = courses.reduce((acc, c) => {
      const lg = (c.letterGrade || '').toLowerCase().trim();
      return acc + (points[lg] || 0);
    }, 0);
    return (totalPoints / courses.length).toFixed(2);
  }, [courses]);

  const avgGrade = React.useMemo(() => {
    if (!courses || courses.length === 0) return 0;
    const total = courses.reduce((acc, c) => acc + (parseFloat(c.grade) || 0), 0);
    return Math.round(total / courses.length);
  }, [courses]);

  const displayName = user.isAnonymous ? "guest" : (profile?.displayName || user.displayName || user.email?.split('@')[0]);

  return (
    <div className="space-y-8 animate-smooth-slow pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">welcome back, {displayName}!</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">ready to tackle your {categoryLabel} today?</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-1 rounded-full text-sm font-medium">
            {isHobbyist ? 'hobbyist' : isHighSchool ? 'high school' : 'college'}
          </Badge>
          {profile?.useAi && (
            <Badge variant="outline" className="px-4 py-1 rounded-full text-sm font-medium border-indigo-200 text-indigo-600 bg-indigo-50">smart buddy enabled</Badge>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/tasks" className="block">
          <Card className="hover:shadow-lg transition-all duration-500 border-none bg-primary/10 group cursor-pointer h-full rounded-[32px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">tasks</span>
              <CheckSquare className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold lowercase">{activeTasks.length} active</div>
              <p className="text-xs text-muted-foreground mt-1 lowercase">manage your workload</p>
            </CardContent>
          </Card>
        </Link>

        {isHobbyist ? (
          <>
            <Card className="hover:shadow-lg transition-all duration-500 border-none bg-accent/20 group h-full rounded-[32px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-sm font-semibold uppercase tracking-wider text-accent-foreground/70">study streak</span>
                <Flame className="h-5 w-5 text-accent-foreground animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold lowercase">{profile?.studyStreak || 0} days</div>
                <p className="text-xs text-muted-foreground mt-1 lowercase">consistency is key</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-500 border-none bg-secondary/50 group h-full rounded-[32px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/70">focus time</span>
                <Clock className="h-5 w-5 text-secondary-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold lowercase">{profile?.focusHours || 0} hours</div>
                <p className="text-xs text-muted-foreground mt-1 lowercase">total flow time</p>
              </CardContent>
            </Card>

            <Link href="/flashcards" className="block">
              <Card className="hover:shadow-lg transition-all duration-500 border-none bg-indigo-500/10 group cursor-pointer h-full rounded-[32px] border-2 border-dashed border-indigo-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-sm font-semibold uppercase tracking-wider text-indigo-700">daily recall</span>
                  <Zap className="h-5 w-5 text-indigo-600 fill-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-700 lowercase">start now</div>
                  <p className="text-xs text-indigo-600/70 mt-1 lowercase">quick 5min session</p>
                </CardContent>
              </Card>
            </Link>
          </>
        ) : (
          <>
            <Link href="/flashcards" className="block">
              <Card className="hover:shadow-lg transition-all duration-500 border-none bg-accent/20 group cursor-pointer h-full rounded-[32px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-sm font-semibold uppercase tracking-wider text-accent-foreground/70">subjects</span>
                  <Layers className="h-5 w-5 text-accent-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold lowercase">{courses?.length || 0} tracked</div>
                  <p className="text-xs text-muted-foreground mt-1 lowercase">flashcards & recall</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/notebooks" className="block">
              <Card className="hover:shadow-lg transition-all duration-500 border-none bg-secondary/50 group cursor-pointer h-full rounded-[32px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/70">notebooks</span>
                  <StickyNote className="h-5 w-5 text-secondary-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold lowercase">0 notes</div>
                  <p className="text-xs text-muted-foreground mt-1 lowercase">organized lecture notes</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tracker" className="block">
              <Card className="hover:shadow-lg transition-all duration-500 border-none bg-muted group cursor-pointer h-full rounded-[32px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">grades</span>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold lowercase">{gpa} GPA</div>
                  <p className="text-xs text-muted-foreground mt-1 lowercase">avg: {avgGrade}%</p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden bg-white rounded-[40px]">
          <CardHeader className="flex flex-row items-center justify-between p-8">
            <div>
              <CardTitle className="font-headline text-2xl lowercase">recent tasks</CardTitle>
              <p className="text-muted-foreground lowercase text-sm">keep track of your deadlines</p>
            </div>
            <Link href="/tasks" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium lowercase">
              view all <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-5 rounded-3xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      <CheckSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground lowercase">{task.title}</p>
                      <p className="text-xs text-muted-foreground lowercase flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3" /> due {isToday(parseISO(task.dueDate)) ? 'today' : format(parseISO(task.dueDate), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="rounded-full px-4 lowercase">
                    {task.priority}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto opacity-20">
                  <CheckSquare className="h-8 w-8" />
                </div>
                <p className="text-muted-foreground lowercase text-sm">no upcoming tasks. take a break!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-primary/5 to-accent/5 rounded-[40px] flex flex-col">
          <CardHeader className="p-8">
            <CardTitle className="font-headline text-2xl lowercase flex items-center justify-between">
              {isHobbyist ? 'quick thoughts' : 'progress'}
              {isHobbyist && <MousePointer2 className="h-5 w-5 text-muted-foreground/30" />}
            </CardTitle>
            <p className="text-muted-foreground text-sm lowercase">
              {isHobbyist ? 'jot down ideas instantly' : `current semester average: ${avgGrade}%`}
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex-1">
            {isHobbyist ? (
              <div className="h-full flex flex-col gap-4">
                <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-3xl p-6 border-2 border-dashed border-muted relative overflow-hidden group">
                  <Textarea 
                    placeholder="what's on your mind?..." 
                    value={stickyNote}
                    onChange={handleStickyChange}
                    className="w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 p-0 text-lg lowercase leading-relaxed placeholder:italic"
                  />
                  <div className="absolute bottom-4 right-6 text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    auto-saving to cloud
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-2xl h-14 font-bold lowercase border-muted hover:bg-white" asChild>
                    <Link href="/notebooks">
                      <BookOpen className="h-4 w-4 mr-2" /> all notes
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-2xl h-14 font-bold lowercase border-muted hover:bg-white" asChild>
                    <Link href="/channel">
                      <Radio className="h-4 w-4 mr-2" /> plaza
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {courses && courses.length > 0 ? (
                  courses.slice(0, 3).map((course: any) => (
                    <div key={course.id} className="space-y-3">
                      <div className="flex justify-between text-sm font-bold lowercase">
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          {course.name}
                        </span>
                        <span className="text-muted-foreground">{course.grade}%</span>
                      </div>
                      <Progress value={parseFloat(course.grade) || 0} className="h-3 bg-white/50 rounded-full" />
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground lowercase">no courses tracked yet.</p>
                    <Button variant="link" asChild className="mt-2 text-primary font-bold lowercase">
                      <Link href="/tracker">add your first course</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Link href="/channel" className="block pt-8">
        <Card className="border-none shadow-md rounded-[32px] bg-primary/5 hover:bg-primary/10 transition-all group overflow-hidden relative">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Radio className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-headline lowercase">the guko channel</h3>
                <p className="text-muted-foreground text-sm lowercase">join the global study plaza. connect with others now.</p>
              </div>
            </div>
            <Button variant="secondary" className="rounded-xl px-8 font-bold lowercase gap-2 group-hover:translate-x-1 transition-transform">
              go online <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
