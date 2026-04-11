
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { GraduationCap, Mail, Lock, Loader2, ArrowRight, ArrowLeft, Sparkles, School, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type Step = 'account' | 'profile' | 'preferences';

export default function SignupPage() {
  const { auth } = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState<Step>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [studentType, setStudentType] = useState<'high-school' | 'college'>('college');
  const [useAi, setUseAi] = useState(true);
  const [focus, setFocus] = useState<'flashcards' | 'notebooks' | 'tasks' | 'all'>('all');

  useEffect(() => {
    if (user && step === 'account') {
      setStep('profile');
    }
  }, [user, step]);

  const handleCreateAccount = async () => {
    if (!auth) return;
    setIsProcessing(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setStep('profile');
    } catch (e: any) {
      setError(e.message || 'could not create account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !db) return;
    setIsProcessing(true);
    try {
      const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
      await setDoc(profileRef, {
        id: user.uid,
        studentType,
        useAi,
        focus,
      });
      router.push('/');
    } catch (e: any) {
      setError('could not save profile');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-smooth-slow">
      <div className="mb-8 text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <GraduationCap className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight lowercase">setup your guko buddy</h1>
        <p className="text-muted-foreground text-lg lowercase">lets get your study experience ready.</p>
      </div>

      <Card className="w-full max-w-lg border-none shadow-2xl rounded-[40px] overflow-hidden bg-white p-2">
        <div className="p-8">
          {step === 'account' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold font-headline lowercase">create account</CardTitle>
                <CardDescription className="lowercase text-base">start your journey with us.</CardDescription>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="pl-10 rounded-2xl h-14 no-focus-ring border-muted"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 rounded-2xl h-14 no-focus-ring border-muted"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-destructive text-sm text-center font-medium lowercase">{error}</p>}

              <Button 
                onClick={handleCreateAccount} 
                disabled={isProcessing || !email || !password}
                className="w-full rounded-2xl h-16 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "create account"}
              </Button>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold font-headline lowercase">student profile</CardTitle>
                <CardDescription className="lowercase text-base">what level are you currently studying at?</CardDescription>
              </div>

              <RadioGroup value={studentType} onValueChange={(v: any) => setStudentType(v)} className="grid gap-4">
                <Label
                  htmlFor="college"
                  className={cn(
                    "flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                    studentType === 'college' ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-muted"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-muted group-hover:bg-primary/20">
                      <GraduationCap className={cn("h-6 w-6", studentType === 'college' ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="font-bold text-lg">college student</div>
                      <div className="text-sm text-muted-foreground lowercase">experience organized by courses.</div>
                    </div>
                  </div>
                  <RadioGroupItem value="college" id="college" className="sr-only" />
                </Label>

                <Label
                  htmlFor="high-school"
                  className={cn(
                    "flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                    studentType === 'high-school' ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-muted"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-muted group-hover:bg-primary/20">
                      <School className={cn("h-6 w-6", studentType === 'high-school' ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="font-bold text-lg">high school student</div>
                      <div className="text-sm text-muted-foreground lowercase">experience organized by classes.</div>
                    </div>
                  </div>
                  <RadioGroupItem value="high-school" id="high-school" className="sr-only" />
                </Label>
              </RadioGroup>

              <Button onClick={() => setStep('preferences')} className="w-full rounded-2xl h-16 text-lg font-bold shadow-xl shadow-primary/20">
                continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold font-headline lowercase">personalize experience</CardTitle>
                <CardDescription className="lowercase text-base">how do you want your guko buddy to help you?</CardDescription>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-3xl border-2 border-muted bg-muted/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-100">
                      <Sparkles className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">smart assistance</div>
                      <div className="text-sm text-muted-foreground lowercase">enable smart quiz and help tools.</div>
                    </div>
                  </div>
                  <Switch checked={useAi} onCheckedChange={setUseAi} />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">primary focus</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'flashcards', label: 'flashcards', icon: Layers },
                      { id: 'notebooks', label: 'notebooks', icon: BookOpen },
                      { id: 'tasks', label: 'tasks', icon: CheckSquare },
                      { id: 'all', label: 'everything', icon: GraduationCap },
                    ].map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        onClick={() => setFocus(item.id as any)}
                        className={cn(
                          "h-24 rounded-3xl flex flex-col gap-2 border-2",
                          focus === item.id ? "border-primary bg-primary/5 text-primary-foreground" : "border-muted"
                        )}
                      >
                        <item.icon className="h-6 w-6" />
                        <span className="font-bold">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep('profile')} className="rounded-2xl h-16 font-bold flex-1">
                  <ArrowLeft className="mr-2 h-5 w-5" /> back
                </Button>
                <Button onClick={handleSaveProfile} disabled={isProcessing} className="rounded-2xl h-16 text-lg font-bold shadow-xl shadow-primary/20 flex-[2]">
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "finish setup"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
