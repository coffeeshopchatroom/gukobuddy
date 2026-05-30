
'use client';

import * as React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Settings, 
  UserCircle, 
  Bell, 
  Sparkles, 
  GraduationCap, 
  School, 
  Gamepad2, 
  ArrowLeft,
  Loader2,
  Check,
  ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const [studentType, setStudentType] = React.useState<'high-school' | 'college' | 'hobbyist'>('college');
  const [useAi, setUseAi] = React.useState(true);
  const [notifications, setNotifications] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setStudentType(profile.studentType || 'college');
      setUseAi(profile.useAi ?? true);
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifications(Notification.permission === 'granted');
    }
  }, [profile]);

  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotifications(result === 'granted');
    if (result === 'granted') {
      toast({ title: "notifications enabled", description: "you will now receive alerts for deadlines." });
    }
  };

  const handleSave = async () => {
    if (!user || !db || !profileRef) return;
    setIsUpdating(true);

    try {
      await setDoc(profileRef, {
        studentType,
        useAi,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "settings saved",
        description: "your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("save failed", error);
      toast({
        variant: "destructive",
        title: "save failed",
        description: "could not update your settings.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-smooth-slow pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">app settings</h1>
      </div>

      <div className="grid gap-8">
        <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold font-headline lowercase">membership mode</CardTitle>
                <CardDescription className="lowercase">choose how guko buddy organizes your experience.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <RadioGroup value={studentType} onValueChange={(v: any) => setStudentType(v)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Label
                htmlFor="college"
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                  studentType === 'college' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-muted/5"
                )}
              >
                <GraduationCap className={cn("h-8 w-8", studentType === 'college' ? "text-primary" : "text-muted-foreground")} />
                <div className="text-center">
                  <span className="font-bold block lowercase">college</span>
                  <span className="text-[10px] text-muted-foreground lowercase">track courses & GPA</span>
                </div>
                <RadioGroupItem value="college" id="college" className="sr-only" />
              </Label>

              <Label
                htmlFor="high-school"
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                  studentType === 'high-school' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-muted/5"
                )}
              >
                <School className={cn("h-8 w-8", studentType === 'high-school' ? "text-primary" : "text-muted-foreground")} />
                <div className="text-center">
                  <span className="font-bold block lowercase">high school</span>
                  <span className="text-[10px] text-muted-foreground lowercase">manage classes & grades</span>
                </div>
                <RadioGroupItem value="high-school" id="high-school" className="sr-only" />
              </Label>

              <Label
                htmlFor="hobbyist"
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                  studentType === 'hobbyist' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-muted/5"
                )}
              >
                <Gamepad2 className={cn("h-8 w-8", studentType === 'hobbyist' ? "text-primary" : "text-muted-foreground")} />
                <div className="text-center">
                  <span className="font-bold block lowercase">hobbyist</span>
                  <span className="text-[10px] text-muted-foreground lowercase">focus on tasks & cards</span>
                </div>
                <RadioGroupItem value="hobbyist" id="hobbyist" className="sr-only" />
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[40px] bg-white">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10">
                <Settings className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold font-headline lowercase">interface preferences</CardTitle>
                <CardDescription className="lowercase">customize your interaction with the platform.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="flex items-center justify-between p-6 rounded-3xl border-2 border-muted bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-100">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <div className="font-bold text-lg lowercase">smart assistant</div>
                  <div className="text-sm text-muted-foreground lowercase">enable generative ai features throughout the app.</div>
                </div>
              </div>
              <Switch checked={useAi} onCheckedChange={setUseAi} />
            </div>

            <div className="flex items-center justify-between p-6 rounded-3xl border-2 border-muted bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-100">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="font-bold text-lg lowercase">desktop alerts</div>
                  <div className="text-sm text-muted-foreground lowercase">receive push notifications for upcoming task deadlines.</div>
                </div>
              </div>
              <Button 
                variant={notifications ? "secondary" : "outline"} 
                size="sm" 
                onClick={handleRequestNotifications}
                disabled={notifications}
                className="rounded-xl lowercase font-bold"
              >
                {notifications ? "enabled" : "enable"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[40px] bg-destructive/5 border border-destructive/10">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold font-headline lowercase text-destructive">system & data</CardTitle>
                <CardDescription className="lowercase">dangerous actions and data management.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 flex flex-col md:flex-row gap-4">
            <Button variant="outline" className="flex-1 rounded-2xl h-14 border-destructive/20 text-destructive hover:bg-destructive/10 font-bold lowercase">
              clear local cache
            </Button>
            <Button variant="destructive" className="flex-1 rounded-2xl h-14 font-bold lowercase">
              delete account
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="rounded-2xl h-16 px-16 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 lowercase"
          >
            {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
            apply settings
          </Button>
        </div>
      </div>
    </div>
  );
}
