
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, UploadCloud } from 'lucide-react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';

const SPRITE_TYPES = ['headshot', 'default', 'happy', 'sad', 'angry', 'bored'];

export function CustomAvatarUploader({ gender, onUploadComplete }: { gender: 'male' | 'female', onUploadComplete: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback((acceptedFiles: File[], type: string) => {
    setFiles(prev => ({ ...prev, [type]: acceptedFiles[0] }));
  }, []);

  const handleUpload = async () => {
    if (!user || Object.keys(files).length !== SPRITE_TYPES.length) {
      alert('Please select all sprite images.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    const avatarId = `custom-${user.uid}`;
    const avatarUrls: Record<string, string> = {};

    try {
      for (const type of SPRITE_TYPES) {
        const file = files[type];
        if (!file) continue;

        const storageRef = ref(storage, `avatars/custom/${user.uid}/${type}.png`);
        const uploadTask = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        avatarUrls[type] = downloadURL;
        setUploadProgress(prev => ({ ...prev, [type]: 100 }));
      }

      const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
      await setDoc(profileRef, {
        selectedAvatar: avatarId,
        avatarGender: gender,
        customAvatar: avatarUrls,
      }, { merge: true });

      onUploadComplete();
    } catch (error) {
      console.error("Failed to upload custom avatar", error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]">
      <div className="bg-[#2e4a1a] p-10 rounded-2xl w-full max-w-4xl text-white font-sans border-4 border-white/20">
        <h2 className="text-6xl font-headline lowercase mb-8 text-center">Upload Your Own Avatar</h2>
        <div className="grid grid-cols-3 gap-6">
          {SPRITE_TYPES.map(type => (
            <Dropzone
              key={type}
              onDrop={acceptedFiles => onDrop(acceptedFiles, type)}
              file={files[type]}
              type={type}
              progress={uploadProgress[type]}
            />
          ))}
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <Button onClick={onUploadComplete} variant="ghost" className="text-white">Cancel</Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || Object.keys(files).length !== SPRITE_TYPES.length}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : 'Upload and Save'}
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
      className={`p-4 border-2 border-dashed rounded-xl text-center flex flex-col items-center justify-center h-48 transition-colors ${isDragActive ? 'border-green-500 bg-green-900/50' : 'border-white/30 hover:bg-white/10'}`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="relative w-full h-full">
            <img src={URL.createObjectURL(file)} alt={type} className="w-full h-full object-contain rounded-md" />
            {progress && <div className="absolute bottom-0 left-0 h-1 bg-green-500" style={{ width: `${progress}%` }} />}
        </div>
      ) : (
        <>
          <UploadCloud className="w-12 h-12 text-white/50 mb-2" />
          <p className="capitalize font-bold text-lg">{type}</p>
          <p className="text-xs text-white/60">Drop a PNG or JPG</p>
        </>
      )}
    </div>
  );
}
