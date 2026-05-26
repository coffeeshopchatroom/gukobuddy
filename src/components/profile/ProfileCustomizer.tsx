'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogTitle,
  DialogDescription
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
import { Loader2, Camera, X, Plus, Hash, UserCircle2 } from 'lucide-react';
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

type BorderTarget = 'profile' | 'add' | 'icon';

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
      body: { type: 'solid', solid: '#111111', gradient: [{ color: '#111111', offset: 0 }, { color: '#222222', offset: 100 }], rotation: 90 } as ColorValue,
      text: { type: 'solid', solid: '#ffffff', gradient: [{ color: '#ffffff', offset: 0 }, { color: '#cccccc', offset: 100 }], rotation: 90 } as ColorValue,
      buttons: { type: 'gradient', solid: '#3b82f6', gradient: [{ color: '#60a5fa', offset: 0 }, { color: '#2563eb', offset: 100 }], rotation: 90 } as ColorValue,
      border: { type: 'solid', solid: '#ffffff33', gradient: [], rotation: 90 } as ColorValue
    },
    borderWidth: 1,
    borderTargets: ['profile', 'add'] as BorderTarget[],
    targetColors: {} as Record<BorderTarget, ColorValue>,
    font: 'Plus Jakarta Sans',
    cornerRounding: 16
  });

  const [uploading, setUploading] = React.useState<'photo' | 'banner' | null>(null);
  const [editingTargetColor, setEditingTargetColor] = React.useState<BorderTarget | null>(null);

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
        borderWidth: profile.borderWidth ?? 1,
        borderTargets: profile.borderTargets || ['profile', 'add'],
        targetColors: profile.targetColors || {},
        font: profile.font || 'Plus Jakarta Sans',
        cornerRounding: profile.cornerRounding ?? 16
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

  const toggleTarget = (target: BorderTarget) => {
    setFormData(prev => {
      const isSelected = prev.borderTargets.includes(target);
      return {
        ...prev,
        borderTargets: isSelected 
          ? prev.borderTargets.filter(t => t !== target)
          : [...prev.borderTargets, target]
      };
    });
  };

  const handleGlobalBorderColorChange = (newVal: ColorValue) => {
    setFormData(prev => ({
      ...prev,
      theme: { ...prev.theme, border: newVal },
      targetColors: {} as Record<BorderTarget, ColorValue> // Master reset logic
    }));
  };

  const previewRounding = `${formData.cornerRounding}px`;
  const bodyBgStyle = getColorStyle(formData.theme.body);

  const getTargetBorderStyle = (target: BorderTarget, currentItemBg: string): React.CSSProperties => {
    if (!formData.borderTargets.includes(target)) return { border: 'none' };
    
    const color = formData.targetColors[target] || formData.theme.border;
    const width = formData.borderWidth;

    if (color.type === 'solid') {
      return { 
        border: `${width}px solid ${color.solid}`,
        backgroundImage: 'none'
      };
    } else {
      const gradient = getColorStyle(color);
      // Use the item's background as the padding mask
      const mask = currentItemBg.includes('gradient') ? currentItemBg : `linear-gradient(${currentItemBg}, ${currentItemBg})`;
      return {
        border: `${width}px solid transparent`,
        backgroundImage: `${mask}, ${gradient}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box'
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[950px] p-0 border-none bg-[#0a0a0a] shadow-none gap-0 overflow-hidden sm:rounded-[40px]">
        <DialogTitle className="sr-only">customize profile</DialogTitle>
        <DialogDescription className="sr-only">adjust your profile aesthetics and personal information.</DialogDescription>
        
        <div 
          className="relative flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden"
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
          <div className="flex-[1] p-6 pt-16 space-y-4 overflow-y-auto custom-scrollbar border-r border-white/5 bg-white/5">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <div 
                  className="h-24 w-24 overflow-hidden flex items-center justify-center bg-white/10 border border-white/10 transition-all aspect-square"
                  style={{ borderRadius: previewRounding }}
                >
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                  ) : (
                    <span className="text-2xl font-bold text-white/30">{formData.displayName?.[0] || '?'}</span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ borderRadius: previewRounding }}>
                  {uploading === 'photo' ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'photo')} />
                </label>
              </div>
              <Label className="text-[9px] font-bold uppercase tracking-widest opacity-40">profile photo</Label>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">display name</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-black/60 border-white/10 border text-white !placeholder-white/20 rounded-xl h-10 no-focus-ring text-sm"
                  placeholder="your name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">username</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-black/60 border-white/10 border text-white !placeholder-white/20 rounded-xl h-10 no-focus-ring text-sm"
                  placeholder="username123"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-black/60 border-white/10 border text-white !placeholder-white/20 rounded-xl min-h-[70px] no-focus-ring resize-none p-3 text-sm"
                  placeholder="tell us something..."
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 font-bold lowercase transition-all">
              save profile
            </Button>
          </div>

          {/* Right Side: Options & Preview */}
          <div className="flex-[1.4] p-6 pt-16 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">banner</Label>
                <div 
                  className="relative w-full h-14 rounded-xl overflow-hidden border border-white/10 group bg-white/5"
                >
                  {formData.bannerUrl ? (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 lowercase text-[10px]">no banner</div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading === 'banner' ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Plus className="h-5 w-5 text-white" />}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">colors</Label>
                <div className="flex items-center justify-around bg-white/5 p-2 rounded-xl border border-white/5 h-14">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">font & radius</Label>
                <div className="space-y-2">
                  <Select value={formData.font} onValueChange={(v) => setFormData(p => ({ ...p, font: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-lg h-8 text-[11px] lowercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2 bg-white/5 p-1 px-2 rounded-lg border border-white/10">
                    <span className="text-[9px] opacity-40 uppercase">rad</span>
                    <Slider 
                      value={[formData.cornerRounding]} 
                      max={48} 
                      onValueChange={(v) => setFormData(p => ({ ...p, cornerRounding: v[0] }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">borders</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10 h-auto min-h-[68px]">
                    <AestheticColorPickerMini 
                      label="color" 
                      value={formData.theme.border} 
                      onChange={handleGlobalBorderColorChange} 
                    />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-[9px] opacity-40 uppercase">width</span>
                        <span className="text-[9px] opacity-40">{formData.borderWidth}px</span>
                      </div>
                      <Slider 
                        value={[formData.borderWidth]} 
                        max={10} 
                        onValueChange={(v) => setFormData(p => ({ ...p, borderWidth: v[0] }))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(['profile', 'add', 'icon'] as BorderTarget[]).map((t) => (
                      <Button
                        key={t}
                        variant="ghost"
                        className={cn(
                          "flex-1 h-7 rounded-md text-[9px] font-bold lowercase border transition-all",
                          formData.borderTargets.includes(t) 
                            ? "bg-white text-black border-white" 
                            : "bg-white/5 text-white/40 border-white/10"
                        )}
                        onClick={() => toggleTarget(t)}
                        onDoubleClick={() => setEditingTargetColor(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">live preview</Label>
              <div 
                className="w-full h-[250px] overflow-hidden relative transition-all duration-300 shadow-2xl"
                style={{ 
                  borderRadius: previewRounding,
                  fontFamily: formData.font,
                  background: bodyBgStyle,
                  color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : '#ffffff'
                }}
              >
                <div className="h-16 w-full relative bg-black/10">
                  {formData.bannerUrl && (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  )}
                </div>
                
                <div className="absolute top-10 left-6 right-6 flex items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div 
                      className="h-24 w-24 overflow-hidden flex items-center justify-center bg-white/10 transition-all shrink-0 aspect-square"
                      style={{ 
                        borderRadius: previewRounding,
                        ...getTargetBorderStyle('profile', 'rgba(255,255,255,0.1)')
                      }}
                    >
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                      ) : (
                        <UserCircle2 className="h-12 w-12 opacity-20" />
                      )}
                    </div>
                    <div className="pb-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="text-4xl font-bold leading-none lowercase truncate">{formData.displayName || 'name'}</h4>
                        <div 
                          className="h-6 w-6 rounded-full bg-white/20 shrink-0"
                          style={{ ...getTargetBorderStyle('icon', 'rgba(255,255,255,0.2)') }}
                        />
                      </div>
                      <p className="text-sm opacity-60 lowercase truncate mt-1">{formData.username ? `@${formData.username}` : '@username'}</p>
                    </div>
                  </div>
                  <Button 
                    className="h-11 px-8 rounded-md text-[11px] font-bold lowercase border-none transition-all shadow-none shrink-0"
                    style={{ 
                      background: getColorStyle(formData.theme.buttons),
                      color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : '#ffffff',
                      borderRadius: previewRounding,
                      ...getTargetBorderStyle('add', getColorStyle(formData.theme.buttons))
                    }}
                  >
                    add friend
                  </Button>
                </div>

                <div className="p-6 pt-24 space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40">about me</h5>
                  <p className="text-xs leading-relaxed lowercase opacity-90 italic line-clamp-2 max-w-[85%]">
                    {formData.bio || 'your bio will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specific Color Dialog */}
        <Dialog open={!!editingTargetColor} onOpenChange={(o) => !o && setEditingTargetColor(null)}>
          <DialogContent className="sm:rounded-[24px] p-6 bg-[#1a1a1a] text-white border-none shadow-3xl max-w-[350px]">
            <DialogTitle className="lowercase">border color: {editingTargetColor}</DialogTitle>
            <DialogDescription className="sr-only">set a custom border color for this item.</DialogDescription>
            {editingTargetColor && (
              <div className="space-y-6">
                <AestheticColorPickerContent
                  label={editingTargetColor}
                  value={formData.targetColors[editingTargetColor] || formData.theme.border}
                  onChange={(v) => setFormData(p => ({ ...p, targetColors: { ...p.targetColors, [editingTargetColor!]: v } }))}
                />
                <Button 
                  onClick={() => setEditingTargetColor(null)} 
                  className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm lowercase hover:bg-white/90"
                >
                  done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
          <DialogTitle className="sr-only">pick color for {label}</DialogTitle>
          <DialogDescription className="sr-only">choose between solid or gradient colors for your profile theme.</DialogDescription>
          <AestheticColorPickerContent label={label} value={value} onChange={onChange} />
          <Button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm lowercase hover:bg-white/90 mt-6">done</Button>
        </DialogContent>
      </Dialog>
      <span className="text-[8px] font-bold lowercase opacity-30 group-hover:opacity-100 transition-opacity">{label}</span>
    </div>
  );
}

function AestheticColorPickerContent({ label, value, onChange }: { label: string, value: ColorValue, onChange: (v: ColorValue) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-headline lowercase">color: {label}</h3>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
          <button 
            onClick={() => onChange({ ...value, type: 'solid' })}
            className={cn("px-3 py-1 text-[9px] font-bold rounded-md transition-all", value.type === 'solid' ? "bg-white text-black" : "opacity-30 hover:opacity-60")}
          >
            solid
          </button>
          <button 
            onClick={() => onChange({ ...value, type: 'gradient' })}
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
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30 text-white" />
              <Input 
                value={value.solid.replace('#', '')} 
                onChange={(e) => onChange({ ...value, solid: `#${e.target.value.replace(/[^0-9a-fA-F]/gi, '')}` })}
                className="bg-black border-white/20 text-white pl-8 h-12 text-sm font-mono rounded-xl lowercase !important"
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
    </div>
  );
}
