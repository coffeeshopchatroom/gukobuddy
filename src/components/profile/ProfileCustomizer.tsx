
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
import { Loader2, Camera, X, Plus } from 'lucide-react';
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

export function ProfileCustomizer({ children, open, onOpenChange }: ProfileCustomizerProps) {
  const { user } = useUser();
  const db = useFirestore();
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile, isLoading } = useDoc(profileRef);

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
    font: 'Arial',
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
        font: profile.font || 'Arial',
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
            borderRadius: `${formData.cornerRounding}px` 
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
          <div className="flex-1 p-8 pt-20 space-y-8 overflow-y-auto custom-scrollbar border-r border-white/10">
            <div className="flex flex-col items-center gap-4">
              <Label className="text-lg font-bold lowercase">profile picture</Label>
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105">
                  <AvatarImage src={formData.photoUrl} className="object-cover" />
                  <AvatarFallback className="bg-white/10 text-white text-3xl font-bold">
                    {formData.displayName?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  {uploading === 'photo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'photo')} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="lowercase font-bold">name</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white rounded-2xl h-12 no-focus-ring placeholder:text-white/30"
                  placeholder="your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="lowercase font-bold">username</Label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white rounded-2xl h-12 no-focus-ring placeholder:text-white/30"
                  placeholder="via"
                />
              </div>
              <div className="space-y-2">
                <Label className="lowercase font-bold">bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white rounded-[24px] min-h-[120px] no-focus-ring placeholder:text-white/30 resize-none"
                  placeholder="sorta like made this app.. or whatever.."
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-bold lowercase">
              save changes
            </Button>
          </div>

          {/* Right Column: Style & Preview */}
          <div className="flex-1 p-8 pt-20 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <Label className="text-lg font-bold lowercase">account banner</Label>
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-white/20 group">
                {formData.bannerUrl ? (
                  <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="banner" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="text-white/30 text-xs lowercase">no banner uploaded</span>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {uploading === 'banner' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                    <span className="text-xs font-bold lowercase">upload banner</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <Label className="text-lg font-bold lowercase">profile theme</Label>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'body', key: 'body' },
                  { label: 'text', key: 'text' },
                  { label: 'buttons', key: 'buttons' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-4">
                    <div className="relative">
                      <input 
                        type="color" 
                        value={formData.theme[item.key as keyof typeof formData.theme]}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          theme: { ...prev.theme, [item.key]: e.target.value } 
                        }))}
                        className="h-10 w-10 rounded-full border-none p-0 overflow-hidden cursor-pointer"
                      />
                      <div 
                        className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none"
                        style={{ backgroundColor: formData.theme[item.key as keyof typeof formData.theme] }}
                      />
                    </div>
                    <span className="font-bold lowercase">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="lowercase font-bold">font</Label>
                  <Select value={formData.font} onValueChange={(v) => setFormData(prev => ({ ...prev, font: v }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl no-focus-ring">
                      <SelectValue placeholder="Arial" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {['Arial', 'Times New Roman', 'Inter', 'monospace', 'cursive'].map(f => (
                        <SelectItem key={f} value={f} className="lowercase">{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="lowercase font-bold">corner rounding: {formData.cornerRounding}</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={formData.cornerRounding}
                      onChange={(e) => setFormData(prev => ({ ...prev, cornerRounding: parseInt(e.target.value) || 0 }))}
                      className="bg-white/10 border-white/20 text-white rounded-xl h-10 w-16 text-center no-focus-ring"
                    />
                    <div className="h-10 w-10 bg-white rounded-md" style={{ borderRadius: `${formData.cornerRounding}px` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-bold lowercase">preview</Label>
              <div 
                className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                style={{ backgroundColor: '#ffffff', borderRadius: `${formData.cornerRounding}px`, fontFamily: formData.font }}
              >
                <div className="h-24 w-full relative shrink-0">
                  <img src={formData.bannerUrl || 'https://picsum.photos/seed/banner/800/200'} className="w-full h-full object-cover" alt="banner" />
                  <div className="absolute -bottom-8 left-6">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={formData.photoUrl} className="object-cover" />
                      <AvatarFallback className="bg-muted text-foreground">
                        {formData.displayName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex-1 p-6 pt-10 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-black lowercase leading-tight">{formData.displayName || 'your name'}</h4>
                      <p className="text-sm text-black/60 lowercase">{formData.username ? `@${formData.username}` : '@username'}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="rounded-xl h-8 px-4 text-xs font-bold shadow-lg"
                      style={{ backgroundColor: formData.theme.buttons, borderRadius: `${formData.cornerRounding / 2}px` }}
                    >
                      add friend
                    </Button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">about me:</span>
                    <p className="text-sm text-black/80 lowercase leading-snug line-clamp-3">
                      {formData.bio || 'i sorta like made this app.. or whatever.. no its fine i dont care either'}
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
