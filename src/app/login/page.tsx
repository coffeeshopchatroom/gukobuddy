
'use client';

import { useState } from 'react';
import { useFirebase, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GraduationCap, UserCircle, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // If user is already logged in, redirect to dashboard
  if (user && !isUserLoading) {
    router.push('/');
    return null;
  }

  const handleSignIn = () => {
    if (auth) {
      setIsProcessing(true);
      initiateEmailSignIn(auth, email, password);
    }
  };

  const handleGuestSignIn = () => {
    if (auth) {
      setIsProcessing(true);
      initiateAnonymousSignIn(auth);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-smooth-slow">
      <div className="mb-8 text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <GraduationCap className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight lowercase">welcome back to guko buddy</h1>
        <p className="text-muted-foreground text-lg lowercase">your personalized study companion.</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] overflow-hidden bg-white">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-bold font-headline lowercase">sign in</CardTitle>
          <CardDescription className="lowercase">enter your details to access your notebooks and flashcards.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10 rounded-2xl h-14 no-focus-ring border-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 rounded-2xl h-14 no-focus-ring border-muted"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSignIn} 
            disabled={isProcessing || !email || !password}
            className="w-full rounded-2xl h-14 font-bold shadow-xl shadow-primary/20"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "sign in"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground lowercase">
              dont have an account?{' '}
              <Link href="/signup" className="text-primary font-bold hover:underline">
                sign up now <ArrowRight className="inline-block h-3 w-3" />
              </Link>
            </p>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-muted"></div>
          </div>

          <Button 
            variant="secondary" 
            onClick={handleGuestSignIn}
            disabled={isProcessing}
            className="w-full rounded-2xl h-14 font-bold bg-muted hover:bg-muted/80 text-muted-foreground border-none transition-all gap-2"
          >
            <UserCircle className="h-5 w-5" />
            continue as guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
