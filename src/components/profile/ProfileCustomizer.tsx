
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useMemoFirebase, 
  setDocumentNonBlocking 
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Camera, X, Plus, Check } from 'lucide-react';
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
  'Inter',
  'Lexend',
  'Montserrat',
  'Space Grotesk',
  'Syne',
  'Outfit',
  'Plus Jakarta Sans',
  'IBM Plex Sans Devanagari',
  'Space Mono',
  'Playfair Display',
  'Courier New'
];

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
      body: '#8b6b61',
      text: '#000000',
      buttons: '#4a69bd'
    },
    font: 'Inter',
    cornerRounding: 12
  });

  const [uploading, setUploading] = React.useState<'photo' | 'banner' | null>(null);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        photoUrl: profile.photoUrl || '',
        bannerUrl: profile.bannerUrl || '',
        theme: profile.theme || { body: '#8b6b61', text: '#000000', buttons: '#4a69bd' },
        font: profile.font || 'Inter',
        cornerRounding: profile.cornerRounding ?? 12
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

  const handleSave = () => {
    if (!profileRef) return;
    setDocumentNonBlocking(profileRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    onOpenChange?.(false);
  };

  const previewRounding = `${formData.cornerRounding}px`;
  const previewAvatarRounding = `${Math.min(formData.cornerRounding, 40)}px`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[1000px] p-0 border-none bg-transparent shadow-none gap-0 overflow-hidden sm:rounded-[40px]">
        <div 
          className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden"
          style={{ 
            backgroundColor: formData.theme.body, 
            color: '#ffffff',
            borderRadius: previewRounding 
          }}
        >
          {/* Header */}
          <div className="absolute top-6 left-8 flex items-center justify-between w-[calc(100%-4rem)] z-10">
            <h2 className="text-2xl font-bold font-headline lowercase">customize your account</h2>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange?.(false)} className="text-white hover:bg-white/10 rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Left Column: Form */}
          <div className="flex-1 p-8 pt-20 space-y-10 overflow-y-auto custom-scrollbar border-r border-white/10">
            <div className="flex flex-col items-center gap-4">
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60 lowercase">profile picture</Label>
              <div className="relative group">
                <div 
                  className="h-32 w-32 border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105 overflow-hidden flex items-center justify-center bg-white/10"
                  style={{ borderRadius: previewAvatarRounding }}
                >
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                  ) : (
                    <span className="text-3xl font-bold">{formData.displayName?.[0] || '?'}</span>
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
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50 lowercase ml-1">name</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-white/10 border-white/10 text-white rounded-2xl h-14 no-focus-ring placeholder:text-white/20"
                  placeholder="name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50 lowercase ml-1">username</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-white/10 border-white/10 text-white rounded-2xl h-14 no-focus-ring placeholder:text-white/20"
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50 lowercase ml-1">bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-white/10 border-white/10 text-white rounded-[28px] min-h-[140px] no-focus-ring placeholder:text-white/20 resize-none"
                  placeholder="tell us about yourself..."
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-lg shadow-xl lowercase transition-all active:scale-95">
              save profile
            </Button>
          </div>

          {/* Right Column: Style & Preview */}
          <div className="flex-1 p-8 pt-20 space-y-10 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60 lowercase">account banner</Label>
              <div 
                className="relative w-full h-36 rounded-[24px] overflow-hidden border-2 border-white/10 group bg-white/5"
              >
                {formData.bannerUrl ? (
                  <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/20 text-xs lowercase">no banner selected</span>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {uploading === 'banner' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6 text-white" />}
                    <span className="text-xs font-bold text-white lowercase">upload banner</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60 lowercase">theme colors</Label>
              <div className="flex flex-row items-center gap-8">
                {[
                  { label: 'body', key: 'body' },
                  { label: 'text', key: 'text' },
                  { label: 'buttons', key: 'buttons' }
                ].map((item) => (
                  <div key={item.key} className="flex flex-col items-center gap-2">
                    <div className="relative h-12 w-12 rounded-2xl overflow-hidden border-2 border-white/20 cursor-pointer">
                      <input 
                        type="color" 
                        value={formData.theme[item.key as keyof typeof formData.theme]}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          theme: { ...prev.theme, [item.key]: e.target.value } 
                        }))}
                        className="absolute inset-0 w-full h-full p-0 border-none scale-150 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-white/50 lowercase">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60 lowercase">typography</Label>
              <Select value={formData.font} onValueChange={(v) => setFormData(prev => ({ ...prev, font: v }))}>
                <SelectTrigger className="bg-white/10 border-white/10 text-white rounded-2xl h-14 no-focus-ring">
                  <SelectValue placeholder="select a font" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {FONT_OPTIONS.map(f => (
                    <SelectItem key={f} value={f} className="lowercase" style={{ fontFamily: f }}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold uppercase tracking-widest text-white/60 lowercase">corner rounding</Label>
                <span className="text-xs font-mono text-white/40">{formData.cornerRounding}px</span>
              </div>
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="0" 
                  max="48" 
                  value={formData.cornerRounding}
                  onChange={(e) => setFormData(prev => ({ ...prev, cornerRounding: parseInt(e.target.value) || 0 }))}
                  className="flex-1 accent-white h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer"
                />
                <div className="h-12 w-12 bg-white flex items-center justify-center" style={{ borderRadius: previewAvatarRounding }}>
                  <div className="h-4 w-4 bg-black/10 rounded-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60 lowercase">live preview</Label>
              <div 
                className="w-full rounded-[32px] overflow-hidden shadow-2xl flex flex-col bg-white"
                style={{ borderRadius: previewRounding, fontFamily: formData.font }}
              >
                <div className="h-28 w-full relative shrink-0 bg-muted">
                  {formData.bannerUrl && (
                    <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                  )}
                  <div className="absolute -bottom-6 left-6 flex items-end gap-5">
                    <div 
                      className="h-24 w-24 border-[5px] border-white shadow-xl overflow-hidden bg-muted-foreground/10 flex items-center justify-center shrink-0"
                      style={{ borderRadius: previewAvatarRounding }}
                    >
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} className="w-full h-full object-cover" alt="pfp" />
                      ) : (
                        <span className="text-2xl font-bold text-black/20">{formData.displayName?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="pb-1">
                      <h4 className="text-2xl font-bold text-black lowercase leading-none tracking-tight">
                        {formData.displayName || 'your name'}
                      </h4>
                      <p className="text-sm text-black/40 lowercase mt-1">
                        {formData.username ? `@${formData.username}` : '@username'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 pt-10 flex flex-col gap-4">
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="px-6 font-bold shadow-lg h-9"
                      style={{ 
                        backgroundColor: formData.theme.buttons, 
                        borderRadius: `${Math.min(formData.cornerRounding, 16)}px` 
                      }}
                    >
                      friend request
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30">about student:</span>
                    <p className="text-sm text-black/70 lowercase leading-relaxed line-clamp-2 italic">
                      {formData.bio || 'this student hasn\'t written a bio yet...'}
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
