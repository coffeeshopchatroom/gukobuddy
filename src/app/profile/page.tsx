'use client';

import * as React from 'react';
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Check, ArrowLeft, Sparkles, School, GraduationCap, Layers, BookOpen, CheckSquare, ShieldCheck, Gamepad2 } from 'lucide-react';
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
  const [username, setUsername] = React.useState('');
  const [photoUrl, setPhotoUrl] = React.useState('');
  const [studentType, setStudentType] = React.useState<'high-school' | 'college' | 'hobbyist'>('college');
  const [useAi, setUseAi] = React.useState(true);
  const [focus, setFocus] = React.useState<'flashcards' | 'notebooks' | 'tasks' | 'all'>('all');
  
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (!user && !isUserLoading) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoUrl(profile?.photoUrl || user.photoURL || '');
    }
    if (profile) {
      setStudentType(profile.studentType || 'college');
      setUseAi(profile.useAi ?? true);
      setFocus(profile.focus || 'all');
      setUsername(profile.username || '');
    }
  }, [user, profile]);

  const useChannelAvatar = () => {
    if (!profile?.selectedAvatar || !profile?.avatarGender) {
      toast({
        variant: "destructive",
        title: "no avatar found",
        description: "pick an avatar in the guko channel first."
      });
      return;
    }

    const genderPath = profile.avatarGender === 'male' ? 'male' : 'female';
    const headshotUrl = `/avatars/${genderPath}/headshots/${profile.selectedAvatar}.png`;
    setPhotoUrl(headshotUrl);
    
    toast({
      title: "avatar selected",
      description: "press 'save changes' to apply this permanently."
    });
  };

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
      
      toast({
        title: "photo staged",
        description: "hit 'save changes' to finalize your update.",
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
      await updateProfile(user, { 
        displayName, 
        photoURL: photoUrl 
      });

      setDocumentNonBlocking(profileRef, {
        displayName,
        username: username.toLowerCase().trim(),
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

  if (isUserLoading || isProfileLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
        <Card className="md:col-span-1 border-none shadow-sm rounded-[40px] bg-card overflow-hidden h-fit">
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
            <div className="space-y-3 w-full">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold font-headline lowercase">{displayName || 'student'}</h3>
                  {profile?.isAdmin && <ShieldCheck className="h-5 w-5 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground lowercase truncate max-w-full">{user.email}</p>
                {username && <p className="text-[10px] font-bold text-primary uppercase tracking-widest">@{username}</p>}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={useChannelAvatar}
                className="w-full rounded-xl text-[10px] font-bold lowercase gap-2 border-primary/20 hover:bg-primary/10 text-primary h-9"
              >
                <Gamepad2 size={14} /> use my channel avatar
              </Button>
            </div>
            <Badge variant="secondary" className="rounded-full px-4 py-1 lowercase">
              {studentType.replace('-', ' ')}
            </Badge>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[40px] bg-card">
            <CardHeader className="p-8 pb-4">
              <h2 className="text-2xl font-bold font-headline lowercase">personal info</h2>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">display name</Label>
                  <Input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="your name"
                    className="rounded-2xl h-14 no-focus-ring border-muted bg-background lowercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">username</Label>
                  <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="unique_username"
                    className="rounded-2xl h-14 no-focus-ring border-muted bg-background lowercase"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">student level</Label>
                <RadioGroup value={studentType} onValueChange={(v: any) => setStudentType(v)} className="grid grid-cols-3 gap-4">
                  {['college', 'high-school', 'hobbyist'].map((type) => (
                    <Label
                      key={type}
                      htmlFor={type}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all cursor-pointer hover:border-primary/50",
                        studentType === type ? "border-primary bg-primary/5" : "border-muted"
                      )}
                    >
                      {type === 'college' ? <GraduationCap className="h-6 w-6" /> : type === 'high-school' ? <School className="h-6 w-6" /> : <Gamepad2 className="h-6 w-6" />}
                      <span className="font-bold lowercase">{type.replace('-', ' ')}</span>
                      <RadioGroupItem value={type} id={type} className="sr-only" />
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[40px] bg-card">
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
                        "h-24 rounded-3xl flex flex-col gap-2 border-2 transition-all lowercase",
                        focus === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-bold">{item.label}</span>
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
