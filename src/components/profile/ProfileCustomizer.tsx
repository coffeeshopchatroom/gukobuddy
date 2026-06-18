
'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader
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
import { 
  Loader2, 
  Camera, 
  X, 
  Plus, 
  Hash, 
  UserCircle2, 
  Wand2, 
  Undo2, 
  Redo2, 
  Star, 
  Trash2,
  RotateCw,
  Layers
} from 'lucide-react';
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

type ElementLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
};

type Sticker = ElementLayout & {
  id: string;
  url: string;
  rotation: number;
};

type ProfileLayout = {
  banner: ElementLayout;
  pfp: ElementLayout;
  name: ElementLayout;
  username: ElementLayout;
  bio: ElementLayout;
  addBtn: ElementLayout;
  aboutHeader: ElementLayout;
};

const DEFAULT_LAYOUT: ProfileLayout = {
  banner: { x: 0, y: 0, w: 600, h: 80, zIndex: 0 },
  pfp: { x: 24, y: 40, w: 96, h: 96, zIndex: 2 },
  name: { x: 136, y: 50, w: 280, h: 48, zIndex: 2 },
  username: { x: 136, y: 98, w: 150, h: 24, zIndex: 2 },
  bio: { x: 24, y: 200, w: 300, h: 60, zIndex: 2 },
  addBtn: { x: 440, y: 50, w: 130, h: 44, zIndex: 2 },
  aboutHeader: { x: 24, y: 175, w: 100, h: 20, zIndex: 2 }
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
      body: { type: 'solid', solid: '#111111', gradient: [{ color: '#111111', offset: 0 }, { color: '#222222', offset: 100 }], rotation: 90 } as ColorValue,
      text: { type: 'solid', solid: '#ffffff', gradient: [{ color: '#ffffff', offset: 0 }, { color: '#cccccc', offset: 100 }], rotation: 90 } as ColorValue,
      buttons: { type: 'gradient', solid: '#3b82f6', gradient: [{ color: '#60a5fa', offset: 0 }, { color: '#2563eb', offset: 100 }], rotation: 90 } as ColorValue,
      border: { type: 'solid', solid: '#ffffff33', gradient: [], rotation: 90 } as ColorValue
    },
    borderWidth: 1,
    borderTargets: ['profile', 'add'] as BorderTarget[],
    targetColors: {} as Record<BorderTarget, ColorValue>,
    font: 'Plus Jakarta Sans',
    cornerRounding: 16,
    layout: DEFAULT_LAYOUT,
    stickers: [] as Sticker[]
  });

  const [uploading, setUploading] = React.useState<'photo' | 'banner' | 'sticker' | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

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
        cornerRounding: profile.cornerRounding ?? 16,
        layout: { ...DEFAULT_LAYOUT, ...profile.layout },
        stickers: (profile.stickers || []).map((s: any) => ({ ...s, rotation: s.rotation || 0, zIndex: s.zIndex || 1 }))
      });
    }
  }, [profile]);

  const handleImageUpload = async (file: File, type: 'photo' | 'banner' | 'sticker') => {
    if (!user) return;
    setUploading(type);
    const filename = `profiles/${user.uid}/${type}-${Date.now()}-${file.name}`;

    try {
      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: 'POST',
        body: file,
      });
      const blob = await response.json();
      if (type === 'sticker') {
        const newSticker: Sticker = {
          id: Math.random().toString(36).substr(2, 9),
          url: blob.url,
          x: 200,
          y: 150,
          w: 80,
          h: 80,
          rotation: 0,
          zIndex: formData.stickers.length + 5
        };
        setFormData(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
      } else {
        setFormData(prev => ({ ...prev, [type === 'photo' ? 'photoUrl' : 'bannerUrl']: blob.url }));
      }
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
      targetColors: {} as Record<BorderTarget, ColorValue>
    }));
  };

  const previewRounding = `${formData.cornerRounding}px`;
  const bodyBgStyle = getColorStyle(formData.theme.body);

  const getTargetBorderStyle = (target: BorderTarget, currentItemBg: string): React.CSSProperties => {
    if (!formData.borderTargets.includes(target)) return { border: 'none' };
    
    const color = formData.targetColors[target] || formData.theme.border;
    const width = formData.borderWidth;

    if (width <= 0) return { border: 'none' };

    if (color.type === 'solid') {
      return { 
        border: `${width}px solid ${color.solid}`,
        backgroundImage: 'none'
      };
    } else {
      const gradient = getColorStyle(color);
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
      <DialogContent className="max-w-[950px] p-0 border-none bg-card shadow-2xl gap-0 overflow-hidden sm:rounded-[40px]">
        <DialogTitle className="sr-only">customize profile</DialogTitle>
        <DialogDescription className="sr-only">adjust your profile aesthetics and personal information.</DialogDescription>
        
        <div className="relative flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden">
          <div className="absolute top-4 right-4 z-50">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange?.(false)} className="text-foreground hover:bg-muted rounded-full h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute top-6 left-8">
            <h2 className="text-lg font-bold font-headline lowercase tracking-tight opacity-90 text-foreground">customize account</h2>
          </div>

          <div className="flex-[1] p-6 pt-16 space-y-4 overflow-y-auto custom-scrollbar border-r border-border/10 bg-muted/20">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <div 
                  className="h-24 w-24 overflow-hidden flex items-center justify-center bg-background border border-border transition-all aspect-square"
                  style={{ borderRadius: previewRounding }}
                >
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground/30">{formData.displayName?.[0] || '?'}</span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ borderRadius: previewRounding }}>
                  {uploading === 'photo' ? <Loader2 className="h-5 w-5 animate-spin text-foreground" /> : <Camera className="h-6 w-6 text-foreground" />}
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
                  className="bg-background border-border text-foreground !placeholder-muted-foreground/40 rounded-xl h-10 no-focus-ring text-sm"
                  placeholder="your name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">username</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-background border-border text-foreground !placeholder-muted-foreground/40 rounded-xl h-10 no-focus-ring text-sm"
                  placeholder="username123"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-background border-border text-foreground !placeholder-muted-foreground/40 rounded-xl min-h-[70px] no-focus-ring resize-none p-3 text-sm"
                  placeholder="tell us something..."
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold lowercase transition-all">
              save profile
            </Button>
          </div>

          <div className="flex-[1.4] p-6 pt-16 space-y-6 overflow-y-auto custom-scrollbar text-foreground">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">banner</Label>
                <div className="relative w-full h-14 rounded-xl overflow-hidden border border-border group bg-muted/10">
                  {formData.bannerUrl ? (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 lowercase text-[10px]">no banner</div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading === 'banner' ? <Loader2 className="h-5 w-5 animate-spin text-foreground" /> : <Plus className="h-5 w-5 text-foreground" />}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">colors</Label>
                <div className="flex items-center justify-around bg-muted/10 p-2 rounded-xl border border-border h-14">
                  <AestheticColorPickerMini label="bg" value={formData.theme.body} onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, body: v } }))} />
                  <AestheticColorPickerMini label="text" value={formData.theme.text} onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, text: v } }))} />
                  <AestheticColorPickerMini label="btn" value={formData.theme.buttons} onChange={(v) => setFormData(p => ({ ...p, theme: { ...p.theme, buttons: v } }))} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">font & radius</Label>
                <div className="space-y-2">
                  <Select value={formData.font} onValueChange={(v) => setFormData(p => ({ ...p, font: v }))}>
                    <SelectTrigger className="bg-background border-border text-foreground rounded-lg h-8 text-[11px] lowercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2 bg-background p-1 px-2 rounded-lg border border-border">
                    <span className="text-[9px] opacity-40 uppercase">rad</span>
                    <Slider value={[formData.cornerRounding]} max={48} onValueChange={(v) => setFormData(p => ({ ...p, cornerRounding: v[0] }))} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">borders</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-background p-2 rounded-lg border border-border h-auto min-h-[68px]">
                    <AestheticColorPickerMini label="color" value={formData.theme.border} onChange={handleGlobalBorderColorChange} />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-[9px] opacity-40 uppercase">width</span>
                        <span className="text-[9px] opacity-40">{formData.borderWidth}px</span>
                      </div>
                      <Slider value={[formData.borderWidth]} max={10} onValueChange={(v) => setFormData(p => ({ ...p, borderWidth: v[0] }))} className="w-full" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(['profile', 'add', 'icon'] as BorderTarget[]).map((t) => (
                      <Button
                        key={t}
                        variant="ghost"
                        className={cn(
                          "flex-1 h-7 rounded-md text-[9px] font-bold lowercase border transition-all",
                          formData.borderTargets.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"
                        )}
                        onClick={() => toggleTarget(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">live preview</Label>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAdvancedOpen(true)}
                  className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 text-foreground"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div 
                className="w-full aspect-[3/2] overflow-hidden relative transition-all duration-300 shadow-2xl border border-border"
                style={{ 
                  borderRadius: previewRounding,
                  fontFamily: formData.font,
                  background: bodyBgStyle,
                }}
              >
                <div 
                  className="absolute transition-all"
                  style={{ 
                    left: formData.layout.banner?.x ?? 0, 
                    top: formData.layout.banner?.y ?? 0,
                    width: formData.layout.banner?.w ?? 0,
                    height: formData.layout.banner?.h ?? 0,
                    zIndex: formData.layout.banner?.zIndex ?? 0
                  }}
                >
                  {formData.bannerUrl ? (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  ) : (
                    <div className="w-full h-full bg-muted/20" />
                  )}
                </div>
                
                <div 
                  className="absolute transition-all"
                  style={{ 
                    left: formData.layout.pfp?.x ?? 0, 
                    top: formData.layout.pfp?.y ?? 0,
                    width: formData.layout.pfp?.w ?? 0,
                    height: formData.layout.pfp?.h ?? 0,
                    borderRadius: previewRounding,
                    zIndex: formData.layout.pfp?.zIndex ?? 2,
                    ...getTargetBorderStyle('profile', bodyBgStyle),
                    overflow: 'hidden'
                  }}
                >
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/20">
                      <UserCircle2 className="h-8 w-8 opacity-20" />
                    </div>
                  )}
                </div>

                <div 
                  className="absolute transition-all flex flex-col justify-center"
                  style={{ 
                    left: formData.layout.name?.x ?? 0, 
                    top: formData.layout.name?.y ?? 0,
                    width: formData.layout.name?.w ?? 0,
                    height: formData.layout.name?.h ?? 0,
                    zIndex: formData.layout.name?.zIndex ?? 2,
                    color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor'
                  }}
                >
                  <h4 className="text-3xl font-bold leading-tight lowercase truncate">{formData.displayName || 'name'}</h4>
                </div>

                <div 
                  className="absolute transition-all"
                  style={{ 
                    left: formData.layout.username?.x ?? 0, 
                    top: formData.layout.username?.y ?? 0,
                    width: formData.layout.username?.w ?? 0,
                    height: formData.layout.username?.h ?? 0,
                    zIndex: formData.layout.username?.zIndex ?? 2,
                    color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor',
                    opacity: 0.6
                  }}
                >
                  <p className="text-sm lowercase truncate">{formData.username ? `@${formData.username}` : '@username'}</p>
                </div>

                <div 
                  className="absolute transition-all"
                  style={{ 
                    left: formData.layout.addBtn?.x ?? 0, 
                    top: formData.layout.addBtn?.y ?? 0,
                    width: formData.layout.addBtn?.w ?? 0,
                    height: formData.layout.addBtn?.h ?? 0,
                    zIndex: formData.layout.addBtn?.zIndex ?? 2
                  }}
                >
                  <Button 
                    className="w-full h-full p-0 text-[11px] font-bold lowercase border-none transition-all shadow-none"
                    style={{ 
                      background: getColorStyle(formData.theme.buttons),
                      color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'white',
                      borderRadius: previewRounding,
                      ...getTargetBorderStyle('add', getColorStyle(formData.theme.buttons))
                    }}
                  >
                    add friend
                  </Button>
                </div>

                <div 
                  className="absolute transition-all"
                  style={{ 
                    left: formData.layout.aboutHeader?.x ?? 0, 
                    top: formData.layout.aboutHeader?.y ?? 0,
                    width: formData.layout.aboutHeader?.w ?? 0,
                    height: formData.layout.aboutHeader?.h ?? 0,
                    zIndex: formData.layout.aboutHeader?.zIndex ?? 2,
                    color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor',
                    opacity: 0.4
                  }}
                >
                  <h5 className="text-[10px] font-bold uppercase tracking-widest">about me</h5>
                </div>

                <div 
                  className="absolute transition-all"
                  style={{ 
                    left: formData.layout.bio?.x ?? 0, 
                    top: formData.layout.bio?.y ?? 0,
                    width: formData.layout.bio?.w ?? 0,
                    height: formData.layout.bio?.h ?? 0,
                    zIndex: formData.layout.bio?.zIndex ?? 2,
                    color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor',
                  }}
                >
                  <p className="text-xs leading-relaxed lowercase opacity-90 italic line-clamp-3">
                    {formData.bio || 'your bio will appear here...'}
                  </p>
                </div>

                {formData.stickers.map((sticker) => (
                  <div 
                    key={sticker.id}
                    className="absolute transition-all pointer-events-none"
                    style={{
                      left: sticker.x, top: sticker.y, width: sticker.w, height: sticker.h,
                      zIndex: sticker.zIndex,
                      transform: `rotate(${sticker.rotation || 0}deg)`
                    }}
                  >
                    <img src={sticker.url} className="w-full h-full object-fill" alt="sticker" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AdvancedProfileEditor 
          open={isAdvancedOpen} 
          onOpenChange={setIsAdvancedOpen}
          formData={formData}
          setFormData={setFormData}
          onStickerUpload={(file: File) => handleImageUpload(file, 'sticker')}
          uploadingSticker={uploading === 'sticker'}
          previewRounding={previewRounding}
          bodyBgStyle={bodyBgStyle}
          getTargetBorderStyle={getTargetBorderStyle}
          getColorStyle={getColorStyle}
        />
      </DialogContent>
    </Dialog>
  );
}

function AdvancedProfileEditor({ 
  open, 
  onOpenChange, 
  formData, 
  setFormData, 
  onStickerUpload, 
  uploadingSticker,
  previewRounding,
  bodyBgStyle,
  getTargetBorderStyle,
  getColorStyle
}: any) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  const [dragState, setDragging] = React.useState<{ 
    id: string, 
    type: 'move' | 'resize' | 'rotate', 
    dir?: string, 
    startX: number, 
    startY: number, 
    initialX: number, 
    initialY: number, 
    initialW: number, 
    initialH: number,
    initialRotation?: number
  } | null>(null);

  const saveToHistory = React.useCallback((newData: any) => {
    const dataCopy = JSON.parse(JSON.stringify(newData));
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataCopy);
      if (newHistory.length > 30) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setFormData(prev);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setFormData(next);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'move' | 'resize' | 'rotate', dir?: string) => {
    e.stopPropagation();
    setSelectedId(id);
    
    if (id === 'banner' && type === 'move') return;

    const element = id.startsWith('sticker-')
      ? formData.stickers.find((s: any) => s.id === id.replace('sticker-', ''))
      : formData.layout[id];
  
    if (!element) return;
  
    setDragging({
      id,
      type,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
      initialW: element.w,
      initialH: element.h,
      initialRotation: 'rotation' in element ? element.rotation : 0
    });
  
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    const updateElement = (prev: any, id: string, changes: any) => {
      if (id.startsWith('sticker-')) {
        const stickerId = id.replace('sticker-', '');
        return {
          ...prev,
          stickers: prev.stickers.map((s: any) => s.id === stickerId ? { ...s, ...changes } : s)
        };
      } else {
        return {
          ...prev,
          layout: {
            ...prev.layout,
            [id]: { ...prev.layout[id], ...changes }
          }
        };
      }
    };

    if (dragState.type === 'move') {
      setFormData((prev: any) => updateElement(prev, dragState.id, {
        x: dragState.initialX + dx,
        y: dragState.initialY + dy
      }));
    } else if (dragState.type === 'resize') {
      const changes: any = {};
      const dir = dragState.dir!;

      if (dir.includes('e')) changes.w = Math.max(10, dragState.initialW + dx);
      if (dir.includes('s')) changes.h = Math.max(10, dragState.initialH + dy);
      
      if (dragState.id !== 'banner') {
        if (dir.includes('w')) {
          const newW = Math.max(10, dragState.initialW - dx);
          changes.w = newW;
          changes.x = dragState.initialX + (dragState.initialW - newW);
        }
        if (dir.includes('n')) {
          const newH = Math.max(10, dragState.initialH - dy);
          changes.h = newH;
          changes.y = dragState.initialY + (dragState.initialH - newH);
        }
      }

      setFormData((prev: any) => updateElement(prev, dragState.id, changes));
    } else if (dragState.type === 'rotate') {
      if (dragState.initialRotation === undefined) return;

      const centerX = dragState.initialX + dragState.initialW / 2;
      const centerY = dragState.initialY + dragState.initialH / 2;

      const startAngle = Math.atan2(dragState.startY - centerY, dragState.startX - centerX) * 180 / Math.PI;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;

      const newRotation = dragState.initialRotation + (currentAngle - startAngle);

      setFormData((prev: any) => updateElement(prev, dragState.id, {
        rotation: newRotation
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      saveToHistory(formData);
      setDragging(null);
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const changeLayer = (delta: number) => {
    if (!selectedId) return;
    
    setFormData((prev: any) => {
      if (selectedId.startsWith('sticker-')) {
        const sid = selectedId.replace('sticker-', '');
        return {
          ...prev,
          stickers: prev.stickers.map((s: any) => 
            s.id === sid ? { ...s, zIndex: Math.max(0, (s.zIndex || 0) + delta) } : s
          )
        };
      } else {
        const currentZ = prev.layout[selectedId as keyof ProfileLayout]?.zIndex ?? 0;
        return {
          ...prev,
          layout: {
            ...prev.layout,
            [selectedId]: { ...prev.layout[selectedId as keyof ProfileLayout], zIndex: Math.max(0, currentZ + delta) }
          }
        };
      }
    });
    saveToHistory(formData);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    if (selectedId.startsWith('sticker-')) {
      const stickerId = selectedId.replace('sticker-', '');
      setFormData((prev: any) => ({
        ...prev,
        stickers: prev.stickers.filter((s: any) => s.id !== stickerId)
      }));
      setSelectedId(null);
      saveToHistory(formData);
    }
  };

  const renderHandle = (id: string, dir: string, className: string) => (
    <div 
      className={cn("absolute w-4 h-4 bg-background border-2 border-primary z-[200] rounded-full shadow-md", className)}
      onPointerDown={(e) => handlePointerDown(e, id, 'resize', dir)}
      onClick={e => e.stopPropagation()}
    />
  );

  const renderSelectionBox = (id: string, element: any) => {
    if (selectedId !== id) return null;
    const isSticker = id.startsWith('sticker-');
    const isBanner = id === 'banner';

    return (
      <div 
        className="absolute border-2 border-primary pointer-events-none z-[199]"
        style={{
          left: (element.x ?? 0) - 4, 
          top: (element.y ?? 0) - 4, 
          width: (element.w || 0) + 8, 
          height: (element.h || 0) + 8,
          transform: `rotate(${element.rotation || 0}deg)`
        }}
      >
        {!isBanner && renderHandle(id, 'nw', "top-[-8px] left-[-8px] cursor-nw-resize pointer-events-auto")}
        {!isBanner && renderHandle(id, 'ne', "top-[-8px] right-[-8px] cursor-ne-resize pointer-events-auto")}
        {!isBanner && renderHandle(id, 'sw', "bottom-[-8px] left-[-8px] cursor-sw-resize pointer-events-auto")}
        {renderHandle(id, 'se', "bottom-[-8px] right-[-8px] cursor-se-resize pointer-events-auto")}
        {isBanner && renderHandle(id, 's', "bottom-[-8px] left-1/2 -translate-x-1/2 cursor-s-resize pointer-events-auto")}
        {isBanner && renderHandle(id, 'e', "right-[-8px] top-1/2 -translate-y-1/2 cursor-e-resize pointer-events-auto")}

        {isSticker && (
          <div
            className="absolute w-5 h-5 flex items-center justify-center bg-background border-2 border-primary z-[200] rounded-full shadow-md top-[-25px] left-1/2 -translate-x-1/2 cursor-alias pointer-events-auto"
            onPointerDown={(e) => handlePointerDown(e, id, 'rotate')}
            onClick={e => e.stopPropagation()}
          >
            <RotateCw className="h-3 w-3 text-primary" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex-1 overflow-hidden relative flex items-center justify-center p-20 bg-muted/5"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => setSelectedId(null)}
    >
      <div 
        className="w-[600px] h-[400px] relative shadow-2xl overflow-hidden shrink-0 border border-border"
        style={{ 
          borderRadius: previewRounding,
          fontFamily: formData.font,
          background: bodyBgStyle,
        }}
      >
        <div 
          className={cn("absolute cursor-pointer", selectedId === 'banner' ? "z-[100]" : "z-[1]")}
          onPointerDown={(e) => handlePointerDown(e, 'banner', 'move')}
          onClick={e => e.stopPropagation()}
          style={{ 
            left: formData.layout.banner?.x ?? 0, 
            top: formData.layout.banner?.y ?? 0,
            width: formData.layout.banner?.w ?? 0,
            height: formData.layout.banner?.h ?? 0,
            zIndex: formData.layout.banner?.zIndex ?? 0
          }}
        >
          {formData.bannerUrl ? (
            <img src={formData.bannerUrl} className="w-full h-full object-cover select-none pointer-events-none" alt="banner" />
          ) : (
            <div className="w-full h-full bg-muted/10" />
          )}
        </div>

        <div 
          className={cn("absolute cursor-pointer", selectedId === 'pfp' ? "z-[100]" : "z-[10]")}
          onPointerDown={(e) => handlePointerDown(e, 'pfp', 'move')}
          onClick={e => e.stopPropagation()}
          style={{ 
            left: formData.layout.pfp?.x ?? 0, 
            top: formData.layout.pfp?.y ?? 0,
            width: formData.layout.pfp?.w ?? 0,
            height: formData.layout.pfp?.h ?? 0,
            borderRadius: previewRounding,
            zIndex: formData.layout.pfp?.zIndex ?? 2,
            ...getTargetBorderStyle('profile', bodyBgStyle),
            overflow: 'hidden'
          }}
        >
          {formData.photoUrl ? (
            <img src={formData.photoUrl} className="w-full h-full object-cover select-none pointer-events-none" alt="pfp" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/10"><UserCircle2 className="h-8 w-8 opacity-20" /></div>
          )}
        </div>

        <div 
          className={cn("absolute cursor-pointer", selectedId === 'name' ? "z-[100]" : "z-[10]")}
          onPointerDown={(e) => handlePointerDown(e, 'name', 'move')}
          onClick={e => e.stopPropagation()}
          style={{ 
            left: formData.layout.name?.x ?? 0, 
            top: formData.layout.name?.y ?? 0,
            width: formData.layout.name?.w ?? 0,
            height: formData.layout.name?.h ?? 0,
            zIndex: formData.layout.name?.zIndex ?? 2,
            color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor'
          }}
        >
          <h4 className="text-3xl font-bold leading-tight lowercase truncate select-none pointer-events-none">
            {formData.displayName || 'name'}
          </h4>
        </div>

        <div 
          className={cn("absolute cursor-pointer", selectedId === 'username' ? "z-[100]" : "z-[10]")}
          onPointerDown={(e) => handlePointerDown(e, 'username', 'move')}
          onClick={e => e.stopPropagation()}
          style={{ 
            left: formData.layout.username?.x ?? 0, 
            top: formData.layout.username?.y ?? 0,
            width: formData.layout.username?.w ?? 0,
            height: formData.layout.username?.h ?? 0,
            zIndex: formData.layout.username?.zIndex ?? 2,
            color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor',
            opacity: 0.6
          }}
        >
          <p className="text-sm lowercase truncate select-none pointer-events-none">{formData.username ? `@${formData.username}` : '@username'}</p>
        </div>

        <div 
          className={cn("absolute cursor-pointer", selectedId === 'addBtn' ? "z-[100]" : "z-[10]")}
          onPointerDown={(e) => handlePointerDown(e, 'addBtn', 'move')}
          onClick={e => e.stopPropagation()}
          style={{ 
            left: formData.layout.addBtn?.x ?? 0, 
            top: formData.layout.addBtn?.y ?? 0,
            width: formData.layout.addBtn?.w ?? 0,
            height: formData.layout.addBtn?.h ?? 0,
            zIndex: formData.layout.addBtn?.zIndex ?? 2
          }}
        >
          <Button 
            className="w-full h-full p-0 text-[11px] font-bold lowercase border-none shadow-none pointer-events-none"
            style={{ 
              background: getColorStyle(formData.theme.buttons),
              color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'white',
              borderRadius: previewRounding,
              ...getTargetBorderStyle('add', getColorStyle(formData.theme.buttons))
            }}
          >
            add friend
          </Button>
        </div>

        <div 
          className={cn("absolute cursor-pointer", selectedId === 'aboutHeader' ? "z-[100]" : "z-[10]")}
          onPointerDown={(e) => handlePointerDown(e, 'aboutHeader', 'move')}
          onClick={e => e.stopPropagation()}
          style={{ 
            left: formData.layout.aboutHeader?.x ?? 0, 
            top: formData.layout.aboutHeader?.y ?? 0,
            width: formData.layout.aboutHeader?.w ?? 0,
            height: formData.layout.aboutHeader?.h ?? 0,
            zIndex: formData.layout.aboutHeader?.zIndex ?? 2,
            color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor',
            opacity: 0.4
          }}
        >
          <h5 className="text-[10px] font-bold uppercase tracking-widest select-none pointer-events-none">about me</h5>
        </div>

        <div 
          className={cn("absolute cursor-pointer", selectedId === 'bio' ? "z-[100]" : "z-[10]")}
          onPointerDown={(e) => handlePointerDown(e, 'bio', 'move')}
          onClick={e => e.stopPropagation()}
          style={{ 
            left: formData.layout.bio?.x ?? 0, 
            top: formData.layout.bio?.y ?? 0,
            width: formData.layout.bio?.w ?? 0,
            height: formData.layout.bio?.h ?? 0,
            zIndex: formData.layout.bio?.zIndex ?? 2,
            color: formData.theme.text.type === 'solid' ? formData.theme.text.solid : 'currentColor',
          }}
        >
          <p className="text-xs leading-relaxed lowercase opacity-90 italic line-clamp-3 select-none pointer-events-none">
            {formData.bio || 'your bio will appear here...'}
          </p>
        </div>

        {formData.stickers.map((sticker: Sticker) => (
          <div 
            key={sticker.id}
            className={cn("absolute cursor-pointer", selectedId === `sticker-${sticker.id}` ? "z-[150]" : "z-[15]")}
            onPointerDown={(e) => handlePointerDown(e, `sticker-${sticker.id}`, 'move')}
            onClick={e => e.stopPropagation()}
            style={{
              left: sticker.x, top: sticker.y, width: sticker.w, height: sticker.h,
              zIndex: sticker.zIndex,
              transform: `rotate(${sticker.rotation || 0}deg)`
            }}
          >
            <img src={sticker.url} className="w-full h-full object-fill select-none pointer-events-none" alt="sticker" />
          </div>
        ))}

        {Object.keys(formData.layout).map(key =>
          renderSelectionBox(key, formData.layout[key as keyof ProfileLayout])
        )}
        {formData.stickers.map((sticker: Sticker) => (
          renderSelectionBox(`sticker-${sticker.id}`, sticker)
        ))}
      </div>
    </div>
  );
}

function AestheticColorPickerMini({ label, value, onChange }: { label: string, value: ColorValue, onChange: (v: ColorValue) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setIsOpen(true)}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div 
            className="h-7 w-7 rounded-lg border border-border transition-transform group-hover:scale-110 shadow-lg shrink-0" 
            style={{ background: value.type === 'solid' ? value.solid : `linear-gradient(${value.rotation ?? 90}deg, ${value.gradient.map(s => `${s.color} ${s.offset}%`).join(', ')})` }}
          />
        </DialogTrigger>
        <DialogContent className="sm:rounded-[24px] p-6 bg-card text-foreground border-none shadow-3xl max-w-[350px]">
          <DialogTitle className="sr-only">pick color for {label}</DialogTitle>
          <DialogDescription className="sr-only">choose between solid or gradient colors.</DialogDescription>
          <AestheticColorPickerContent label={label} value={value} onChange={onChange} />
          <Button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm lowercase hover:bg-primary/90 mt-6">done</Button>
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
        <div className="flex gap-1 bg-muted rounded-lg p-0.5 border border-border">
          <button onClick={() => onChange({ ...value, type: 'solid' })} className={cn("px-3 py-1 text-[9px] font-bold rounded-md transition-all", value.type === 'solid' ? "bg-card text-foreground shadow-sm" : "opacity-30 hover:opacity-60")}>solid</button>
          <button onClick={() => onChange({ ...value, type: 'gradient' })} className={cn("px-3 py-1 text-[9px] font-bold rounded-md transition-all", value.type === 'gradient' ? "bg-card text-foreground shadow-sm" : "opacity-30 hover:opacity-60")}>gradient</button>
        </div>
      </div>

      {value.type === 'solid' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border">
              <input type="color" value={value.solid} onChange={(e) => onChange({ ...value, solid: e.target.value })} className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
            </div>
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30 text-foreground" />
              <Input 
                value={value.solid.replace('#', '')} 
                onChange={(e) => onChange({ ...value, solid: `#${e.target.value.replace(/[^0-9a-fA-F]/gi, '')}` })}
                className="bg-background border-border text-foreground pl-8 h-12 text-sm font-mono rounded-xl !lowercase"
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
