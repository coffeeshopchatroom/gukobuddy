
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
  ShieldAlert,
  Palette,
  Image as ImageIcon,
  Type,
  Maximize2,
  Upload
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRESET_THEMES = [
  { id: 'classic', name: 'classic', primary: '#A7C4A0', bg: '#FFFFFF', accent: '#FFF0F0' },
  { id: 'midnight', name: 'midnight', primary: '#3B82F6', bg: '#0F172A', accent: '#1E293B' },
  { id: 'sunset', name: 'sunset', primary: '#F97316', bg: '#FFF7ED', accent: '#FFEDD5' },
  { id: 'matcha', name: 'matcha', primary: '#4D7C0F', bg: '#F7FEE7', accent: '#ECFCCB' },
  { id: 'lavender', name: 'lavender', primary: '#8B5CF6', bg: '#F5F3FF', accent: '#EDE9FE' },
];

const FONTS = [
  { id: 'IBM Plex Sans Devanagari', name: 'plex (clean)' },
  { id: 'Plus Jakarta Sans', name: 'jakarta (modern)' },
  { id: 'Inter', name: 'inter (standard)' },
  { id: 'Crimson Pro', name: 'crimson (classic)' },
  { id: 'JetBrains Mono', name: 'jetbrains (code)' },
];

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

  // Theme state
  const [activeTheme, setActiveTheme] = React.useState('classic');
  const [primaryColor, setPrimaryColor] = React.useState('#A7C4A0');
  const [bgColor, setBgColor] = React.useState('#FFFFFF');
  const [accentColor, setAccentColor] = React.useState('#FFF0F0');
  const [bgImage, setBgImage] = React.useState('');
  const [bgOpacity, setBgOpacity] = React.useState(20);
  const [fontFamily, setFontFamily] = React.useState('IBM Plex Sans Devanagari');
  const [fontSize, setFontSize] = React.useState('base');

  React.useEffect(() => {
    if (profile) {
      setStudentType(profile.studentType || 'college');
      setUseAi(profile.useAi ?? true);
      
      if (profile.theme) {
        setActiveTheme(profile.theme.activeTheme || 'classic');
        setPrimaryColor(profile.theme.customColors?.primary || '#A7C4A0');
        setBgColor(profile.theme.customColors?.background || '#FFFFFF');
        setAccentColor(profile.theme.customColors?.accent || '#FFF0F0');
        setBgImage(profile.theme.backgroundImage || '');
        setBgOpacity(profile.theme.bgOpacity ?? 20);
        setFontFamily(profile.theme.fontFamily || 'IBM Plex Sans Devanagari');
        setFontSize(profile.theme.fontSize || 'base');
      }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const filename = `backgrounds/${user.uid}/${Date.now()}-${file.name}`;
    try {
      const response = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: file });
      const blob = await response.json();
      setBgImage(blob.url || '');
      toast({ title: "background uploaded", description: "save settings to apply permanently." });
    } catch (error) {
      console.error("upload failed", error);
    }
  };

  const applyPreset = (theme: typeof PRESET_THEMES[0]) => {
    setActiveTheme(theme.id);
    setPrimaryColor(theme.primary);
    setBgColor(theme.bg);
    setAccentColor(theme.accent);
  };

  const handleSave = async () => {
    if (!user || !db || !profileRef) return;
    setIsUpdating(true);

    try {
      await setDoc(profileRef, {
        studentType,
        useAi,
        theme: {
          activeTheme: activeTheme || 'classic',
          customColors: {
            primary: primaryColor || '#A7C4A0',
            background: bgColor || '#FFFFFF',
            accent: accentColor || '#FFF0F0',
          },
          backgroundImage: bgImage || '',
          bgOpacity: bgOpacity ?? 20,
          fontFamily: fontFamily || 'IBM Plex Sans Devanagari',
          fontSize: fontSize || 'base',
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "settings saved",
        description: "your preferences and theme have been updated successfully.",
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
    <div className="max-w-4xl mx-auto space-y-12 animate-smooth-slow pb-20 relative z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">app settings</h1>
      </div>

      <div className="grid gap-8">
        {/* Membership Section */}
        <Card className="border-none shadow-sm rounded-[40px] bg-white/80 backdrop-blur-md overflow-hidden">
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

        {/* Theme Engine Section */}
        <Card className="border-none shadow-sm rounded-[40px] bg-white/80 backdrop-blur-md overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10">
                <Palette className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold font-headline lowercase">theming & appearance</CardTitle>
                <CardDescription className="lowercase">style the app exactly how you want it.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-10">
            {/* Presets */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">mood presets</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {PRESET_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyPreset(t)}
                    className={cn(
                      "group flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-105",
                      activeTheme === t.id ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex overflow-hidden">
                       <div className="flex-1" style={{ backgroundColor: t.primary }} />
                       <div className="flex-1" style={{ backgroundColor: t.accent }} />
                    </div>
                    <span className="text-xs font-bold lowercase">{t.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => setActiveTheme('custom')}
                  className={cn(
                    "group flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-dashed transition-all hover:scale-105",
                    activeTheme === 'custom' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-primary to-accent shadow-sm" />
                  <span className="text-xs font-bold lowercase">custom</span>
                </button>
              </div>
            </div>

            {/* Custom Color Controls (only if custom is active) */}
            {activeTheme === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-muted/30 border border-muted animate-in fade-in slide-in-from-top-2">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">primary color</Label>
                    <div className="flex items-center gap-3">
                       <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer" />
                       <span className="text-xs font-mono uppercase opacity-60">{primaryColor}</span>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">background</Label>
                    <div className="flex items-center gap-3">
                       <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer" />
                       <span className="text-xs font-mono uppercase opacity-60">{bgColor}</span>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">accent color</Label>
                    <div className="flex items-center gap-3">
                       <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer" />
                       <span className="text-xs font-mono uppercase opacity-60">{accentColor}</span>
                    </div>
                 </div>
              </div>
            )}

            {/* Typography & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Type className="h-3 w-3" /> typography
                  </Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="rounded-2xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTS.map(f => (
                        <SelectItem key={f.id} value={f.id} style={{ fontFamily: f.id }}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2"><Maximize2 className="h-3 w-3" /> text size</span>
                    <span className="font-mono">{fontSize}</span>
                  </Label>
                  <RadioGroup value={fontSize} onValueChange={(v: any) => setFontSize(v)} className="flex gap-2 p-1 bg-muted rounded-xl">
                    {['sm', 'base', 'lg', 'xl'].map((s) => (
                      <Label
                        key={s}
                        htmlFor={`fs-${s}`}
                        className={cn(
                          "flex-1 text-center py-2 rounded-lg cursor-pointer text-xs font-bold transition-all",
                          fontSize === s ? "bg-white shadow-sm" : "opacity-40 hover:opacity-100"
                        )}
                      >
                        {s}
                        <RadioGroupItem value={s} id={`fs-${s}`} className="sr-only" />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" /> custom background
                  </Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1 group">
                      <div className={cn(
                        "h-12 w-full rounded-2xl border-2 border-dashed flex items-center justify-center text-xs font-bold transition-all",
                        bgImage ? "border-primary bg-primary/5" : "border-muted"
                      )}>
                        {bgImage ? "image active" : "no background"}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>
                    {bgImage && (
                      <Button variant="ghost" onClick={() => setBgImage('')} className="rounded-xl h-12 lowercase text-destructive">clear</Button>
                    )}
                  </div>
                </div>

                <div className={cn("space-y-3 transition-all", !bgImage && "opacity-20 pointer-events-none")}>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    background intensity
                    <span className="font-mono">{bgOpacity}%</span>
                  </Label>
                  <Slider value={[bgOpacity]} max={100} onValueChange={(v) => setBgOpacity(v[0])} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interface Preferences */}
        <Card className="border-none shadow-sm rounded-[40px] bg-white/80 backdrop-blur-md">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100">
                <Sparkles className="h-6 w-6 text-indigo-600" />
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

        {/* Danger Zone */}
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
            className="rounded-3xl h-16 px-16 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 lowercase"
          >
            {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
            apply settings
          </Button>
        </div>
      </div>
    </div>
  );
}
