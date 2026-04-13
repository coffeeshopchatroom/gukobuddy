
'use client';

import * as React from 'react';
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Check, ArrowLeft, Sparkles, School, GraduationCap, Layers, BookOpen, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const [displayName, setDisplayName] = React.useState('');
  const [photoUrl, setPhotoUrl] = React.useState('');
  const [studentType, setStudentType] = React.useState<'high-school' | 'college'>('college');
  const [useAi, setUseAi] = React.useState(true);
  const [focus, setFocus] = React.useState<'flashcards' | 'notebooks' | 'tasks' | 'all'>('all');
  
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoUrl(user.photoURL || '');
    }
    if (profile) {
      setStudentType(profile.studentType || 'college');
      setUseAi(profile.useAi ?? true);
      setFocus(profile.focus || 'all');
    }
  }, [user, profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filename = `profile_pictures/${user.uid}/${Date.now()}-${file.name}`;

    try {
      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: 'POST',
        body: file,
      });

      const blob = await response.json();
      const newUrl = blob.url;
      setPhotoUrl(newUrl);
      
      await updateProfile(user, { photoURL: newUrl });
      
      if (profileRef) {
        await setDoc(profileRef, { photoUrl: newUrl }, { merge: true });
      }

      toast({
        title: "photo updated",
        description: "your profile picture has been changed.",
      });
    } catch (error) {
      console.error("upload failed", error);
      toast({
        variant: "destructive",
        title: "upload failed",
        description: "could not update your photo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !db || !profileRef) return;
    setIsUpdating(true);

    try {
      await updateProfile(user, { displayName });

      await setDoc(profileRef, {
        displayName,
        photoUrl,
        studentType,
        useAi,
        focus,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "profile saved",
        description: "your settings have been updated.",
      });
    } catch (error) {
      console.error("save failed", error);
      toast({
        variant: "destructive",
        title: "save failed",
        description: "could not update your profile.",
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
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">account settings</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 border-none shadow-sm rounded-[40px] bg-white overflow-hidden h-fit">
          <CardContent className="p-8 flex flex-col items-center gap-6 text-center">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-xl transition-transform group-hover:scale-105">
                <AvatarImage src={photoUrl} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                  {displayName?.[0] || user.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-all scale-90 hover:scale-100"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold font-headline lowercase">{displayName || 'student'}</h3>
              <p className="text-xs text-muted-foreground lowercase truncate max-w-full">{user.email}</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-4 py-1 lowercase">
              {studentType === 'high-school' ? 'high school' : 'college'}
            </Badge>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[40px] bg-white">
            <CardHeader className="p-8 pb-4">
              <h2 className="text-2xl font-bold font-headline lowercase">personal info</h2>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">display name</Label>
                <Input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="your name"
                  className="rounded-2xl h-14 no-focus-ring border-muted lowercase"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">student level</Label>
                <RadioGroup value={studentType} onValueChange={(v: any) => setStudentType(v)} className="grid grid-cols-2 gap-4">
                  <Label
                    htmlFor="college"
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                      studentType === 'college' ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <GraduationCap className={cn("h-6 w-6", studentType === 'college' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-bold lowercase">college</span>
                    <RadioGroupItem value="college" id="college" className="sr-only" />
                  </Label>
                  <Label
                    htmlFor="high-school"
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                      studentType === 'high-school' ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <School className={cn("h-6 w-6", studentType === 'high-school' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-bold lowercase">high school</span>
                    <RadioGroupItem value="high-school" id="high-school" className="sr-only" />
                  </Label>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[40px] bg-white">
            <CardHeader className="p-8 pb-4">
              <h2 className="text-2xl font-bold font-headline lowercase">preferences</h2>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="flex items-center justify-between p-6 rounded-3xl border-2 border-muted bg-muted/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-100">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-bold text-lg lowercase">smart assistant</div>
                    <div className="text-sm text-muted-foreground lowercase">use ai features to study.</div>
                  </div>
                </div>
                <Switch checked={useAi} onCheckedChange={setUseAi} />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">primary focus</Label>
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
                      type="button"
                      onClick={() => setFocus(item.id as any)}
                      className={cn(
                        "h-24 rounded-3xl flex flex-col gap-2 border-2 transition-all",
                        focus === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-bold lowercase">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              onClick={handleSave} 
              disabled={isUpdating}
              className="rounded-2xl h-16 px-12 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 lowercase"
            >
              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
              save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
