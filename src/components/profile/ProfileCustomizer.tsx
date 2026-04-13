'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useMemoFirebase, 
  setDocumentNonBlocking 
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Camera, X, Plus, Trash2, Palette, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

interface ProfileCustomizerProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FONT_OPTIONS = [
  'system-ui',
  'Plus Jakarta Sans',
  'IBM Plex Sans Devanagari',
  'monospace',
  'serif',
  'cursive',
  'fantasy',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia'
];

type GradientStop = {
  color: string;
  offset: number;
};

type ColorValue = {
  type: 'solid' | 'gradient';
  solid: string;
  gradient: GradientStop[];
};

export function ProfileCustomizer({ children, open, onOpenChange }: ProfileCustomizerProps) {
  const { user } = useUser();
  const db = useFirestore();
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile } = useDoc(profileRef);

  const [formData, setFormData] = React.useState({
    displayName: '',
    username: '',
    bio: '',
    photoUrl: '',
    bannerUrl: '',
    theme: {
      body: { type: 'solid', solid: '#8b6b61', gradient: [{ color: '#8b6b61', offset: 0 }, { color: '#5d4037', offset: 100 }] } as ColorValue,
      text: { type: 'solid', solid: '#000000', gradient: [{ color: '#000000', offset: 0 }, { color: '#333333', offset: 100 }] } as ColorValue,
      buttons: { type: 'solid', solid: '#3b82f6', gradient: [{ color: '#60a5fa', offset: 0 }, { color: '#2563eb', offset: 100 }] } as ColorValue
    },
    font: 'system-ui',
    cornerRounding: 0
  });

  const [uploading, setUploading] = React.useState<'photo' | 'banner' | null>(null);

  React.useEffect(() => {
    if (profile) {
      // Helper to parse stored theme strings if they exist, otherwise use defaults
      const parseColor = (val: any, fallback: ColorValue): ColorValue => {
        if (!val) return fallback;
        if (typeof val === 'string') {
          if (val.startsWith('linear-gradient')) {
            // Very basic parser for the stored string - in a real app this would be more robust
            return { type: 'gradient', solid: fallback.solid, gradient: fallback.gradient };
          }
          return { type: 'solid', solid: val, gradient: fallback.gradient };
        }
        return val;
      };

      setFormData({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        photoUrl: profile.photoUrl || '',
        bannerUrl: profile.bannerUrl || '',
        theme: {
          body: parseColor(profile.theme?.body, formData.theme.body),
          text: parseColor(profile.theme?.text, formData.theme.text),
          buttons: parseColor(profile.theme?.buttons, formData.theme.buttons)
        },
        font: profile.font || 'system-ui',
        cornerRounding: profile.cornerRounding ?? 0
      });
    }
  }, [profile]);

  const handleImageUpload = async (file: File, type: 'photo' | 'banner') => {
    if (!user) return;
    setUploading(type);
    const filename = `profiles/${user.uid}/${type}-${Date.now()}-${file.name}`;

    try {
      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: 'POST',
        body: file,
      });
      const blob = await response.json();
      setFormData(prev => ({ ...prev, [type === 'photo' ? 'photoUrl' : 'bannerUrl']: blob.url }));
    } catch (error) {
      console.error("upload failed", error);
    } finally {
      setUploading(null);
    }
  };

  const getColorStyle = (val: ColorValue) => {
    if (val.type === 'solid') return val.solid;
    const stops = [...val.gradient].sort((a, b) => a.offset - b.offset);
    return `linear-gradient(90deg, ${stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;
  };

  const handleSave = () => {
    if (!profileRef) return;
    
    // Convert complex color objects to CSS strings for storage to keep backend.json simple
    const serializedTheme = {
      body: getColorStyle(formData.theme.body),
      text: getColorStyle(formData.theme.text),
      buttons: getColorStyle(formData.theme.buttons)
    };

    setDocumentNonBlocking(profileRef, {
      ...formData,
      theme: serializedTheme,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    onOpenChange?.(false);
  };

  const previewRounding = `${formData.cornerRounding}px`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[1100px] p-0 border-none bg-transparent shadow-none gap-0 overflow-hidden sm:rounded-[48px]">
        <div 
          className="flex flex-col md:flex-row h-full max-h-[92vh] overflow-hidden"
          style={{ 
            backgroundColor: formData.theme.body.type === 'solid' ? formData.theme.body.solid : 'transparent', 
            backgroundImage: formData.theme.body.type === 'gradient' ? getColorStyle(formData.theme.body) : 'none',
            color: '#ffffff',
            borderRadius: previewRounding 
          }}
        >
          {/* Header */}
          <div className="absolute top-6 left-10 flex items-center justify-between w-[calc(100%-5rem)] z-10">
            <h2 className="text-2xl font-bold font-headline lowercase tracking-tight">customize profile</h2>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange?.(false)} className="text-white hover:bg-white/10 rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Left Column: Form & Color Customizer */}
          <div className="flex-1 p-10 pt-24 space-y-10 overflow-y-auto custom-scrollbar border-r border-white/10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div 
                  className="h-32 w-32 overflow-hidden flex items-center justify-center bg-white/10"
                  style={{ borderRadius: previewRounding }}
                >
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                  ) : (
                    <span className="text-3xl font-bold text-white/30">{formData.displayName?.[0] || '?'}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2.5 bg-white text-black rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  {uploading === 'photo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'photo')} />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 lowercase ml-1">name</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-white/10 border-white/10 text-white rounded-2xl h-14 no-focus-ring placeholder:text-white/20"
                  placeholder="name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 lowercase ml-1">username</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-white/10 border-white/10 text-white rounded-2xl h-14 no-focus-ring placeholder:text-white/20"
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 lowercase ml-1">bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-white/10 border-white/10 text-white rounded-[28px] min-h-[120px] no-focus-ring placeholder:text-white/20 resize-none"
                  placeholder="about you..."
                />
              </div>
            </div>

            <div className="space-y-8 pt-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-white/40 lowercase">aesthetic theme</Label>
              <div className="space-y-10">
                <AestheticColorPicker 
                  label="profile background" 
                  value={formData.theme.body} 
                  onChange={(val) => setFormData(prev => ({ ...prev, theme: { ...prev.theme, body: val } }))} 
                />
                <AestheticColorPicker 
                  label="profile text" 
                  value={formData.theme.text} 
                  onChange={(val) => setFormData(prev => ({ ...prev, theme: { ...prev.theme, text: val } }))} 
                />
                <AestheticColorPicker 
                  label="add friend button" 
                  value={formData.theme.buttons} 
                  onChange={(val) => setFormData(prev => ({ ...prev, theme: { ...prev.theme, buttons: val } }))} 
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-lg shadow-xl lowercase transition-all active:scale-95">
              save profile
            </Button>
          </div>

          {/* Right Column: Style & Preview */}
          <div className="flex-1 p-10 pt-24 space-y-10 overflow-y-auto custom-scrollbar bg-black/5">
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-white/40 lowercase">banner image</Label>
              <div 
                className="relative w-full h-36 rounded-[24px] overflow-hidden border-2 border-white/10 group bg-white/5"
              >
                {formData.bannerUrl ? (
                  <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/10 text-xs lowercase">no banner</span>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex flex-col items-center gap-1">
                    {uploading === 'banner' ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Plus className="h-5 w-5 text-white" />}
                    <span className="text-[10px] font-bold text-white lowercase">upload banner</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-white/40 lowercase">typography</Label>
                <Select value={formData.font} onValueChange={(v) => setFormData(prev => ({ ...prev, font: v }))}>
                  <SelectTrigger className="bg-white/10 border-white/10 text-white rounded-2xl h-14 no-focus-ring">
                    <SelectValue placeholder="font" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f} value={f} className="lowercase" style={{ fontFamily: f }}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-white/40 lowercase">corner rounding</Label>
                  <span className="text-[10px] font-mono text-white/30">{formData.cornerRounding}px</span>
                </div>
                <Slider 
                  min={0} 
                  max={48} 
                  step={1}
                  value={[formData.cornerRounding]}
                  onValueChange={([v]) => setFormData(prev => ({ ...prev, cornerRounding: v }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="space-y-4 pt-6">
              <Label className="text-xs font-bold uppercase tracking-widest text-white/40 lowercase">live preview</Label>
              <div 
                className="w-full min-h-[400px] overflow-hidden flex flex-col transition-all duration-300 shadow-2xl"
                style={{ 
                  borderRadius: previewRounding, 
                  fontFamily: formData.font,
                  backgroundColor: formData.theme.body.type === 'solid' ? formData.theme.body.solid : 'transparent',
                  backgroundImage: formData.theme.body.type === 'gradient' ? getColorStyle(formData.theme.body) : 'none',
                  color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'inherit'
                }}
              >
                {/* Banner */}
                <div className="h-32 w-full relative bg-muted/20">
                  {formData.bannerUrl && (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  )}
                  {/* PFP and Header Section - LOWERED */}
                  <div className="absolute -bottom-16 left-6 flex items-end gap-6">
                    <div 
                      className="h-32 w-32 bg-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-none"
                      style={{ borderRadius: previewRounding }}
                    >
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                      ) : (
                        <span className="text-2xl font-bold text-black/10">{formData.displayName?.[0] || '?'}</span>
                      )}
                    </div>
                    {/* Text aligned with center of lowered PFP */}
                    <div className="pb-4 flex flex-col">
                      <h4 className="text-3xl font-bold lowercase leading-tight">
                        {formData.displayName || 'student'}
                      </h4>
                      <p className="text-sm lowercase opacity-70">
                        {formData.username ? `via @${formData.username}` : 'via student'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 pt-20 flex flex-col items-start gap-8">
                  {/* Add Friend Button - Precise position */}
                  <Button 
                    className="px-10 h-11 font-bold shadow-lg transition-transform active:scale-95 border-none"
                    style={{ 
                      borderRadius: `${Math.min(formData.cornerRounding, 8)}px`,
                      backgroundColor: formData.theme.buttons.type === 'solid' ? formData.theme.buttons.solid : 'transparent',
                      backgroundImage: formData.theme.buttons.type === 'gradient' ? getColorStyle(formData.theme.buttons) : 'none',
                      color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : '#ffffff'
                    }}
                  >
                    add friend
                  </Button>

                  <div className="space-y-3 w-full">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40 lowercase">about me:</span>
                    <p className="text-2xl font-normal lowercase leading-snug max-w-lg">
                      {formData.bio || 'tell the world about your study habits...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AestheticColorPicker({ label, value, onChange }: { label: string, value: ColorValue, onChange: (val: ColorValue) => void }) {
  const addStop = () => {
    const newStops = [...value.gradient, { color: '#ffffff', offset: 100 }];
    onChange({ ...value, gradient: newStops });
  };

  const removeStop = (index: number) => {
    if (value.gradient.length <= 2) return;
    const newStops = value.gradient.filter((_, i) => i !== index);
    onChange({ ...value, gradient: newStops });
  };

  const updateStop = (index: number, updates: Partial<GradientStop>) => {
    const newStops = value.gradient.map((s, i) => i === index ? { ...s, ...updates } : s);
    onChange({ ...value, gradient: newStops });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 lowercase">{label}</Label>
        <div className="flex bg-white/5 rounded-full p-0.5 border border-white/10">
          <button 
            onClick={() => onChange({ ...value, type: 'solid' })}
            className={cn("px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all", value.type === 'solid' ? "bg-white text-black" : "text-white/40 hover:text-white")}
          >
            solid
          </button>
          <button 
            onClick={() => onChange({ ...value, type: 'gradient' })}
            className={cn("px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all", value.type === 'gradient' ? "bg-white text-black" : "text-white/40 hover:text-white")}
          >
            gradient
          </button>
        </div>
      </div>

      {value.type === 'solid' ? (
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-white/20">
            <input 
              type="color" 
              value={value.solid}
              onChange={(e) => onChange({ ...value, solid: e.target.value })}
              className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
            />
          </div>
          <span className="text-xs font-mono text-white/50">{value.solid}</span>
        </div>
      ) : (
        <div className="space-y-4 bg-white/5 p-5 rounded-[28px] border border-white/5">
          <div className="flex flex-wrap gap-4">
            {value.gradient.map((stop, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 pr-3 pl-1.5 py-1.5 rounded-2xl border border-white/10">
                <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-white/20">
                  <input 
                    type="color" 
                    value={stop.color}
                    onChange={(e) => updateStop(i, { color: e.target.value })}
                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                  />
                </div>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={stop.offset}
                  onChange={(e) => updateStop(i, { offset: parseInt(e.target.value) || 0 })}
                  className="w-10 bg-transparent text-[10px] font-mono text-white focus:outline-none"
                />
                {value.gradient.length > 2 && (
                  <button onClick={() => removeStop(i)} className="text-white/20 hover:text-destructive transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addStop}
              className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div 
            className="h-2 w-full rounded-full border border-white/10" 
            style={{ 
              background: `linear-gradient(90deg, ${[...value.gradient].sort((a,b)=>a.offset-b.offset).map(s => `${s.color} ${s.offset}%`).join(', ')})`
            }} 
          />
        </div>
      )}
    </div>
  );
}
