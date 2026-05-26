'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
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
import { Loader2, Camera, X, Plus, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { Slider } from '@/components/ui/slider';

interface ProfileCustomizerProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FONT_OPTIONS = [
  'Arial',
  'Plus Jakarta Sans',
  'IBM Plex Sans Devanagari',
  'monospace',
  'serif',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Courier New'
];

type GradientStop = {
  color: string;
  offset: number;
};

type ColorValue = {
  type: 'solid' | 'gradient';
  solid: string;
  gradient: GradientStop[];
  rotation?: number;
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
      body: { type: 'solid', solid: '#8b6b61', gradient: [{ color: '#8b6b61', offset: 0 }, { color: '#5d4037', offset: 100 }], rotation: 90 } as ColorValue,
      text: { type: 'solid', solid: '#ffffff', gradient: [{ color: '#ffffff', offset: 0 }, { color: '#cccccc', offset: 100 }], rotation: 90 } as ColorValue,
      buttons: { type: 'gradient', solid: '#3b82f6', gradient: [{ color: '#60a5fa', offset: 0 }, { color: '#2563eb', offset: 100 }], rotation: 90 } as ColorValue,
      border: { type: 'solid', solid: '#ffffff33', gradient: [], rotation: 90 } as ColorValue
    },
    borderWidth: 0,
    font: 'Arial',
    cornerRounding: 0
  });

  const [uploading, setUploading] = React.useState<'photo' | 'banner' | null>(null);

  React.useEffect(() => {
    if (profile) {
      const parseColor = (val: any, fallback: ColorValue): ColorValue => {
        if (!val) return fallback;
        if (typeof val === 'object' && val.type) {
          return { ...fallback, ...val };
        }
        return { ...fallback, type: 'solid', solid: typeof val === 'string' ? val : fallback.solid };
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
          buttons: parseColor(profile.theme?.buttons, formData.theme.buttons),
          border: parseColor(profile.theme?.border, formData.theme.border)
        },
        borderWidth: profile.borderWidth ?? 0,
        font: profile.font || 'Arial',
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
    const rotation = val.rotation ?? 90;
    return `linear-gradient(${rotation}deg, ${stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;
  };

  const handleSave = () => {
    if (!profileRef) return;
    setDocumentNonBlocking(profileRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    onOpenChange?.(false);
  };

  const previewRounding = `${formData.cornerRounding}px`;
  const borderStyle = `solid ${formData.borderWidth}px ${getColorStyle(formData.theme.border)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[900px] p-0 border-none bg-[#111] shadow-none gap-0 overflow-hidden sm:rounded-[32px]">
        <div 
          className="relative flex flex-col md:flex-row h-full max-h-[85vh] overflow-hidden"
          style={{ color: '#ffffff' }}
        >
          {/* Header Controls */}
          <div className="absolute top-4 right-4 z-50">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange?.(false)} className="text-white hover:bg-white/10 rounded-full h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute top-6 left-8">
            <h2 className="text-lg font-bold font-headline lowercase tracking-tight opacity-90">customize account</h2>
          </div>

          {/* Left Side: Inputs */}
          <div className="flex-[1] p-8 pt-16 space-y-6 overflow-y-auto custom-scrollbar border-r border-white/5 bg-white/5">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <div 
                  className="h-24 w-24 overflow-hidden flex items-center justify-center bg-white/10 border border-white/10 transition-all"
                  style={{ borderRadius: previewRounding }}
                >
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                  ) : (
                    <span className="text-2xl font-bold text-white/30">{formData.displayName?.[0] || '?'}</span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ borderRadius: previewRounding }}>
                  {uploading === 'photo' ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Camera className="h-4 w-4 text-white" />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'photo')} />
                </label>
              </div>
              <Label className="text-[9px] font-bold uppercase tracking-widest opacity-40">profile photo</Label>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">display name</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-black/20 border-white/10 border text-white rounded-xl h-10 no-focus-ring placeholder:text-white/20 text-sm"
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">username</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-black/20 border-white/10 border text-white rounded-xl h-10 no-focus-ring placeholder:text-white/20 text-sm"
                  placeholder="username123"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-black/20 border-white/10 border text-white rounded-xl min-h-[80px] no-focus-ring placeholder:text-white/20 resize-none p-3 text-sm"
                  placeholder="tell us something..."
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold lowercase transition-all">
              save profile
            </Button>
          </div>

          {/* Right Side: Options & Preview */}
          <div className="flex-[1.2] p-8 pt-16 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">banner</Label>
                <div 
                  className="relative w-full h-16 rounded-xl overflow-hidden border border-white/10 group bg-white/5"
                >
                  {formData.bannerUrl ? (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 lowercase text-[10px]">no banner</div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading === 'banner' ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Plus className="h-4 w-4 text-white" />}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">colors</Label>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                  <AestheticColorPickerMini 
                    label="bg" 
                    value={formData.theme.body} 
                    onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, body: v } }))} 
                  />
                  <AestheticColorPickerMini 
                    label="text" 
                    value={formData.theme.text} 
                    onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, text: v } }))} 
                  />
                  <AestheticColorPickerMini 
                    label="btn" 
                    value={formData.theme.buttons} 
                    onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, buttons: v } }))} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">font & rounding</Label>
                <div className="space-y-3">
                  <Select value={formData.font} onValueChange={(v) => setFormData(p => ({ ...p, font: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-lg h-9 text-xs lowercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-3 bg-white/5 p-1.5 px-3 rounded-lg border border-white/10">
                    <span className="text-[10px] opacity-40">radius</span>
                    <Input 
                      type="number" 
                      value={formData.cornerRounding} 
                      onChange={(e) => setFormData(p => ({ ...p, cornerRounding: parseInt(e.target.value) || 0 }))}
                      className="w-8 h-6 bg-transparent border-none text-white text-center p-0 no-focus-ring text-xs"
                    />
                    <Slider 
                      value={[formData.cornerRounding]} 
                      max={32} 
                      onValueChange={(v) => setFormData(p => ({ ...p, cornerRounding: v[0] }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">border settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-white/5 p-1.5 px-3 rounded-lg border border-white/10">
                    <AestheticColorPickerMini 
                      label="color" 
                      value={formData.theme.border} 
                      onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, border: v } }))} 
                    />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-[10px] opacity-40">width</span>
                        <span className="text-[10px] opacity-40">{formData.borderWidth}px</span>
                      </div>
                      <Slider 
                        value={[formData.borderWidth]} 
                        max={10} 
                        onValueChange={(v) => setFormData(p => ({ ...p, borderWidth: v[0] }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">live preview</Label>
              <div 
                className="w-full h-[220px] overflow-hidden relative transition-all duration-300 border shadow-2xl"
                style={{ 
                  borderRadius: previewRounding,
                  fontFamily: formData.font,
                  background: getColorStyle(formData.theme.body),
                  color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : '#ffffff',
                  border: borderStyle
                }}
              >
                <div className="h-16 w-full relative bg-black/10">
                  {formData.bannerUrl && (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  )}
                </div>
                
                <div className="absolute top-12 left-5 flex items-end gap-3">
                  <div 
                    className="h-16 w-16 overflow-hidden flex items-center justify-center bg-white/10 transition-all border border-white/5"
                    style={{ borderRadius: previewRounding }}
                  >
                    {formData.photoUrl && (
                      <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                    )}
                  </div>
                  <div className="pb-1">
                    <h4 className="text-lg font-bold leading-none lowercase mb-0.5">{formData.displayName || 'name'}</h4>
                    <p className="text-[10px] opacity-60 lowercase">{formData.username ? `@${formData.username}` : '@username'}</p>
                  </div>
                </div>

                <div className="p-4 pt-14 space-y-1">
                  <p className="text-xs leading-tight lowercase opacity-90 italic">
                    {formData.bio || 'your bio will appear here...'}
                  </p>
                  <Button 
                    className="h-7 px-4 rounded-md text-[9px] font-bold lowercase border-none transition-all shadow-none mt-2"
                    style={{ 
                      background: getColorStyle(formData.theme.buttons),
                      color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : '#ffffff',
                      borderRadius: previewRounding
                    }}
                  >
                    add friend
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AestheticColorPickerMini({ label, value, onChange }: { label: string, value: ColorValue, onChange: (v: ColorValue) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setIsOpen(true)}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div 
            className="h-7 w-7 rounded-lg border border-white/20 transition-transform group-hover:scale-110 shadow-lg shrink-0" 
            style={{ background: value.type === 'solid' ? value.solid : `linear-gradient(${value.rotation ?? 90}deg, ${value.gradient.map(s => `${s.color} ${s.offset}%`).join(', ')})` }}
          />
        </DialogTrigger>
        <DialogContent className="sm:rounded-[24px] p-6 bg-[#1a1a1a] text-white border-none shadow-3xl max-w-[350px]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-headline lowercase">color: {label}</h3>
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
                <button 
                  onClick={(e) => { e.stopPropagation(); onChange({ ...value, type: 'solid' }); }}
                  className={cn("px-3 py-1 text-[9px] font-bold rounded-md transition-all", value.type === 'solid' ? "bg-white text-black" : "opacity-30 hover:opacity-60")}
                >
                  solid
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onChange({ ...value, type: 'gradient' }); }}
                  className={cn("px-3 py-1 text-[9px] font-bold rounded-md transition-all", value.type === 'gradient' ? "bg-white text-black" : "opacity-30 hover:opacity-60")}
                >
                  gradient
                </button>
              </div>
            </div>

            {value.type === 'solid' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-white/10">
                    <input 
                      type="color" 
                      value={value.solid} 
                      onChange={(e) => onChange({ ...value, solid: e.target.value })} 
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30" />
                    <Input 
                      value={value.solid.replace('#', '')} 
                      onChange={(e) => onChange({ ...value, solid: `#${e.target.value}` })}
                      className="bg-white/10 border-white/10 text-white pl-8 h-12 text-sm font-mono rounded-xl lowercase"
                      placeholder="ffffff"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <GradientPicker 
                gradient={value.gradient}
                setGradient={(newGradient) => onChange({ ...value, gradient: newGradient })}
                rotation={value.rotation ?? 90}
                setRotation={(newRotation) => onChange({ ...value, rotation: newRotation })}
              />
            )}
            <Button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm lowercase hover:bg-white/90">done</Button>
          </div>
        </DialogContent>
      </Dialog>
      <span className="text-[8px] font-bold lowercase opacity-30 group-hover:opacity-100 transition-opacity">{label}</span>
    </div>
  );
}
