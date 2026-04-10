
'use client';

import { useState } from 'react';
import { useFirebase, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, UserCircle, Mail, Lock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  const handleSignUp = () => {
    if (auth) {
      setIsProcessing(true);
      initiateEmailSignUp(auth, email, password);
    }
  };

  const handleGuestSignIn = () => {
    if (auth) {
      setIsProcessing(true);
      initiateAnonymousSignIn(auth);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="mb-8 text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <GraduationCap className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Welcome to guko buddy</h1>
        <p className="text-muted-foreground text-lg">Your personalized study companion.</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-bold font-headline">Sign In</CardTitle>
          <CardDescription>Enter your details to access your notebooks and flashcards.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10 rounded-xl h-12 no-focus-ring border-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 rounded-xl h-12 no-focus-ring border-muted"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleSignIn} 
              disabled={isProcessing || !email || !password}
              className="rounded-xl h-12 font-bold shadow-lg"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignUp} 
              disabled={isProcessing || !email || !password}
              className="rounded-xl h-12 font-bold border-2"
            >
              Sign Up
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-muted"></div>
          </div>

          <Button 
            variant="secondary" 
            onClick={handleGuestSignIn}
            disabled={isProcessing}
            className="w-full rounded-xl h-14 font-bold bg-accent/10 hover:bg-accent/20 text-accent-foreground border-none transition-all gap-2"
          >
            <UserCircle className="h-5 w-5" />
            Continue as Guest
          </Button>

          <p className="text-center text-xs text-muted-foreground px-4">
            Guest sessions are temporary. Sign up later to save your progress permanently.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
