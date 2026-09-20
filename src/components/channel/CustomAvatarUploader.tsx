'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';

const SPRITE_TYPES = ['headshot', 'default', 'happy', 'sad', 'angry', 'bored'];

export function CustomAvatarUploader({ gender, onUploadComplete }: { gender: 'male' | 'female', onUploadComplete: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback((acceptedFiles: File[], type: string) => {
    setFiles(prev => ({ ...prev, [type]: acceptedFiles[0] }));
  }, []);

  const handleUpload = async () => {
    if (!user || !db) {
      alert('You must be signed in to upload an avatar.');
      return;
    }

    const missingSprites = SPRITE_TYPES.filter(type => !files[type]);
    if (missingSprites.length > 0) {
      alert(`Please select all sprite images. Missing: ${missingSprites.join(', ')}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    const avatarId = `custom-${user.uid}`;
    const avatarUrls: Record<string, string> = {};

    try {
      // 1. Upload all binary files via our server API to Vercel Blob
      for (const type of SPRITE_TYPES) {
        const file = files[type];
        if (!file) continue;

        const filename = `custom-avatars/${user.uid}/${type}-${Date.now()}-${file.name}`;
        
        const response = await fetch(`/api/upload?filename=${filename}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to upload ${type}`);
        }

        const blob = await response.json();
        avatarUrls[type] = blob.url;
        setUploadProgress(prev => ({ ...prev, [type]: 100 }));
      }

      // 2. Save metadata to Firestore (CLIENT SIDE WRITE)
      // Performing the write on the client ensures we use the user's authenticated context,
      // which is required by the Firestore Security Rules.
      const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
      setDocumentNonBlocking(profileRef, {
        selectedAvatar: avatarId,
        avatarGender: gender,
        customAvatar: avatarUrls,
      }, { merge: true });
      
      onUploadComplete();
    } catch (error: any) {
      console.error("Failed to upload custom avatar", error);
      alert(`Failed to upload avatar: ${error.message || 'Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4">
      <div className="bg-[#2e4a1a] p-8 md:p-12 rounded-[40px] w-full max-w-5xl text-white font-sans border-4 border-white/20 relative overflow-y-auto max-h-[95vh] custom-scrollbar shadow-3xl">
        <button 
          onClick={onUploadComplete}
          className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
        >
          <X size={40} />
        </button>
        
        <div className="mb-12 text-center">
          <h2 className="text-6xl font-headline lowercase mb-2">Character Studio</h2>
          <p className="text-white/60 lowercase text-xl">upload transparent pngs for each expression.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {SPRITE_TYPES.map(type => (
            <div key={type} className="space-y-2">
              <Dropzone
                onDrop={acceptedFiles => onDrop(acceptedFiles, type)}
                file={files[type]}
                type={type}
                progress={uploadProgress[type]}
              />
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">{type}</span>
                {files[type] && <span className="text-[10px] text-green-400 font-bold uppercase">Ready</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center gap-6">
          <Button 
            onClick={onUploadComplete} 
            variant="ghost" 
            className="text-white h-16 px-12 rounded-2xl text-xl font-bold lowercase hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || SPRITE_TYPES.some(t => !files[t])}
            className="bg-white text-[#2e4a1a] hover:bg-white/90 h-16 px-16 rounded-2xl text-2xl font-bold shadow-xl lowercase"
          >
            {isUploading ? (
              <span className="flex items-center gap-3">
                <Loader2 className="animate-spin h-6 w-6" /> processing...
              </span>
            ) : 'Save Character'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Dropzone({ onDrop, file, type, progress }: { onDrop: (files: File[]) => void, file: File | null, type: string, progress?: number }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative p-4 border-2 border-dashed rounded-[32px] text-center flex flex-col items-center justify-center h-48 transition-all cursor-pointer ${
        isDragActive ? 'border-white bg-white/10 scale-105' : 'border-white/20 bg-black/10 hover:bg-black/20 hover:border-white/40'
      }`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="relative w-full h-full flex items-center justify-center">
            <img src={URL.createObjectURL(file)} alt={type} className="w-full h-full object-contain" />
            {progress !== undefined && progress < 100 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[32px]">
                <Loader2 className="animate-spin text-white h-8 w-8" />
              </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-white/50" />
          </div>
          <div className="space-y-0.5">
            <p className="lowercase font-bold text-lg">{type}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-tighter">click or drop png</p>
          </div>
        </div>
      )}
    </div>
  );
}
