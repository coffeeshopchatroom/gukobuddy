
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
import { Loader2, Camera, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

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
      text: { type: 'solid', solid: '#ffffff', gradient: [{ color: '#ffffff', offset: 0 }, { color: '#cccccc', offset: 100 }] } as ColorValue,
      buttons: { type: 'gradient', solid: '#3b82f6', gradient: [{ color: '#60a5fa', offset: 0 }, { color: '#2563eb', offset: 100 }] } as ColorValue
    },
    font: 'Arial',
    cornerRounding: 0
  });

  const [uploading, setUploading] = React.useState<'photo' | 'banner' | null>(null);

  React.useEffect(() => {
    if (profile) {
      const parseColor = (val: any, fallback: ColorValue): ColorValue => {
        if (!val) return fallback;
        if (typeof val === 'object' && val.type) return val;
        return { type: 'solid', solid: typeof val === 'string' ? val : fallback.solid, gradient: fallback.gradient };
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
    return `linear-gradient(90deg, ${stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;
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
  const bodyStyle = getColorStyle(formData.theme.body);
  const textStyle = getColorStyle(formData.theme.text);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[1000px] p-0 border-none bg-[#1a1a1a] shadow-none gap-0 overflow-hidden sm:rounded-[48px]">
        <div 
          className="relative flex flex-col md:flex-row h-full max-h-[92vh] overflow-hidden"
          style={{ 
            color: '#ffffff',
            borderRadius: '48px'
          }}
        >
          {/* Header Controls */}
          <div className="absolute top-6 right-6 z-50">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange?.(false)} className="text-white hover:bg-white/10 rounded-full">
              <X className="h-8 w-8" />
            </Button>
          </div>

          <div className="absolute top-8 left-10">
            <h2 className="text-2xl font-bold font-headline lowercase tracking-tight opacity-90">customize your account</h2>
          </div>

          {/* Left Side: Inputs */}
          <div className="flex-[1.2] p-10 pt-24 space-y-8 overflow-y-auto custom-scrollbar border-r border-white/5 bg-white/5">
            <div className="flex flex-col items-center gap-4">
              <Label className="text-sm font-bold uppercase tracking-widest opacity-50">profile picture</Label>
              <div className="relative group">
                <div 
                  className="h-36 w-36 overflow-hidden flex items-center justify-center bg-white/10 border-none transition-all"
                  style={{ borderRadius: previewRounding }}
                >
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                  ) : (
                    <span className="text-4xl font-bold text-white/30">{formData.displayName?.[0] || '?'}</span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ borderRadius: previewRounding }}>
                  {uploading === 'photo' ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'photo')} />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">name</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-transparent border-white/10 border-2 text-white rounded-[20px] h-14 no-focus-ring placeholder:text-white/20"
                  placeholder="olivia"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">username</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-transparent border-white/10 border-2 text-white rounded-[20px] h-14 no-focus-ring placeholder:text-white/20"
                  placeholder="via"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-transparent border-white/10 border-2 text-white rounded-[24px] min-h-[120px] no-focus-ring placeholder:text-white/20 resize-none p-4"
                  placeholder="tell us something..."
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-bold lowercase transition-all">
              save profile
            </Button>
          </div>

          {/* Right Side: Options & Preview */}
          <div className="flex-1 p-10 pt-24 space-y-10 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">account banner</Label>
              <div 
                className="relative w-full h-24 rounded-[20px] overflow-hidden border-2 border-white/10 group bg-white/5"
              >
                {formData.bannerUrl ? (
                  <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 lowercase text-xs">no banner</div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading === 'banner' ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Plus className="h-4 w-4 text-white" />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">profile theme</Label>
              <div className="flex items-center gap-8 bg-white/5 p-4 rounded-3xl border border-white/5">
                <AestheticColorPickerMini 
                  label="body" 
                  value={formData.theme.body} 
                  onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, body: v } }))} 
                />
                <AestheticColorPickerMini 
                  label="text" 
                  value={formData.theme.text} 
                  onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, text: v } }))} 
                />
                <AestheticColorPickerMini 
                  label="buttons" 
                  value={formData.theme.buttons} 
                  onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, buttons: v } }))} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">font</Label>
                <Select value={formData.font} onValueChange={(v) => setFormData(p => ({ ...p, font: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-12 lowercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">rounding</Label>
                <div className="flex items-center gap-4 bg-white/5 p-2 px-4 rounded-xl border border-white/10 h-12">
                  <Input 
                    type="number" 
                    value={formData.cornerRounding} 
                    onChange={(e) => setFormData(p => ({ ...p, cornerRounding: parseInt(e.target.value) || 0 }))}
                    className="w-12 bg-transparent border-none text-white text-center p-0 no-focus-ring"
                  />
                  <div 
                    className="h-6 w-6 bg-white border-none transition-all flex-shrink-0" 
                    style={{ borderRadius: previewRounding }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">live preview</Label>
              <div 
                className="w-full h-[320px] overflow-hidden relative transition-all duration-300 shadow-none border border-white/5"
                style={{ 
                  borderRadius: previewRounding,
                  fontFamily: formData.font,
                  background: getColorStyle(formData.theme.body),
                  color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : '#ffffff'
                }}
              >
                {/* Banner */}
                <div className="h-28 w-full relative bg-white/5">
                  {formData.bannerUrl && (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  )}
                </div>
                
                {/* Profile Section */}
                <div className="absolute top-20 left-6 flex items-end gap-5">
                  <div 
                    className="h-24 w-24 overflow-hidden flex items-center justify-center bg-white/10 border-none transition-all"
                    style={{ borderRadius: previewRounding }}
                  >
                    {formData.photoUrl && (
                      <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                    )}
                  </div>
                  <div className="pb-1 flex items-center gap-10">
                    <div className="flex flex-col">
                      <h4 className="text-2xl font-normal leading-tight lowercase">{formData.displayName || 'name'}</h4>
                      <p className="text-xs opacity-60 lowercase">{formData.username ? `@${formData.username}` : '@username'}</p>
                    </div>
                    
                    <Button 
                      className="h-9 px-8 rounded-md text-[10px] font-bold lowercase border-none transition-all shadow-none"
                      style={{ 
                        background: getColorStyle(formData.theme.buttons),
                        color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : '#ffffff',
                        fontFamily: formData.font,
                        borderRadius: previewRounding
                      }}
                    >
                      add friend
                    </Button>
                  </div>
                </div>

                <div className="p-6 pt-20 space-y-2">
                  <span className="text-[9px] font-bold uppercase opacity-40">about me:</span>
                  <p className="text-sm leading-relaxed lowercase max-w-[90%] opacity-90">
                    {formData.bio || 'your bio will appear here... keep it simple and cute.'}
                  </p>
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
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div 
              className="h-12 w-12 rounded-2xl border-2 border-white/5 transition-transform group-hover:scale-110 shadow-lg" 
              style={{ background: value.type === 'solid' ? value.solid : `linear-gradient(90deg, ${value.gradient.map(s => `${s.color} ${s.offset}%`).join(', ')})` }}
            />
            <span className="text-[9px] font-bold lowercase opacity-40 group-hover:opacity-100 transition-opacity">{label}</span>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:rounded-[40px] p-8 bg-[#222] text-white border-none shadow-3xl">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-headline lowercase">color: {label}</h3>
              <div className="flex gap-2 bg-white/5 rounded-full p-1 border border-white/5">
                <button 
                  onClick={() => onChange({ ...value, type: 'solid' })}
                  className={cn("px-5 py-2 text-[10px] font-bold rounded-full transition-all", value.type === 'solid' ? "bg-white text-black" : "opacity-30 hover:opacity-60")}
                >
                  solid
                </button>
                <button 
                  onClick={() => onChange({ ...value, type: 'gradient' })}
                  className={cn("px-5 py-2 text-[10px] font-bold rounded-full transition-all", value.type === 'gradient' ? "bg-white text-black" : "opacity-30 hover:opacity-60")}
                >
                  gradient
                </button>
              </div>
            </div>

            {value.type === 'solid' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-white/10">
                    <input 
                      type="color" 
                      value={value.solid} 
                      onChange={(e) => onChange({ ...value, solid: e.target.value })} 
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <Input 
                    value={value.solid} 
                    onChange={(e) => onChange({ ...value, solid: e.target.value })}
                    className="bg-white/5 border-none text-lg font-mono rounded-xl h-16 text-center"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-4">
                  {value.gradient.map((stop, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-white/10">
                        <input 
                          type="color" 
                          value={stop.color} 
                          onChange={(e) => {
                            const newStops = [...value.gradient];
                            newStops[i].color = e.target.value;
                            onChange({ ...value, gradient: newStops });
                          }} 
                          className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] opacity-40 uppercase">offset</span>
                        <input 
                          type="number" 
                          value={stop.offset} 
                          onChange={(e) => {
                            const newStops = [...value.gradient];
                            newStops[i].offset = parseInt(e.target.value) || 0;
                            onChange({ ...value, gradient: newStops });
                          }}
                          className="w-10 bg-transparent text-xs font-mono border-none focus:outline-none"
                        />
                      </div>
                      {value.gradient.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-30 hover:opacity-100 hover:text-destructive" onClick={() => {
                          onChange({ ...value, gradient: value.gradient.filter((_, idx) => idx !== i) });
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const maxOffset = Math.max(...value.gradient.map(s => s.offset));
                      onChange({ ...value, gradient: [...value.gradient, { color: '#ffffff', offset: Math.min(100, maxOffset + 10) }] });
                    }}
                    className="h-16 w-16 flex items-center justify-center bg-white/5 border-white/10 rounded-2xl hover:bg-white/10"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div 
                  className="h-6 w-full rounded-full border border-white/10 shadow-inner" 
                  style={{ background: `linear-gradient(90deg, ${value.gradient.map(s => `${s.color} ${s.offset}%`).join(', ')})` }}
                />
              </div>
            )}
            <Button onClick={() => setIsOpen(false)} className="w-full h-16 rounded-2xl bg-white text-black font-bold text-lg lowercase hover:bg-white/90">done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

