
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Hybrid upload route.
 * 1. If 'filename' is in query params, it uploads the binary body to Vercel Blob.
 * 2. Otherwise, it expects JSON data to update Firestore profile settings.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  // Case 1: Binary File Upload to Vercel Blob
  if (filename) {
    try {
      if (!request.body) {
        return NextResponse.json({ error: 'No file body provided' }, { status: 400 });
      }

      // Upload directly to Vercel Blob
      const blob = await put(filename, request.body, {
        access: 'public',
      });

      return NextResponse.json(blob);
    } catch (error) {
      console.error('Vercel Blob upload error:', error);
      return NextResponse.json({ error: 'Failed to upload to blob storage' }, { status: 500 });
    }
  }

  // Case 2: JSON Metadata Update (e.g. for custom avatars)
  try {
    const data = await request.json();
    const { userId, avatarId, avatarGender, customAvatar } = data;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const profileRef = doc(firestore, 'users', userId, 'profile', 'settings');

    // If we have custom avatar data, save it to the user's profile
    if (avatarId && avatarGender && customAvatar) {
      await setDoc(profileRef, {
        selectedAvatar: avatarId,
        avatarGender: avatarGender,
        customAvatar: customAvatar,
      }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload API processing error:", error);
    return NextResponse.json({ 
      error: 'Invalid request. Send a file with ?filename= or valid JSON data.' 
    }, { status: 400 });
  }
}
