
import { type NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  const { firestore } = initializeFirebase();
  const { userId, avatarId, avatarGender, customAvatar } = await request.json();

  if (!userId || !avatarId || !avatarGender || !customAvatar) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const profileRef = doc(firestore, 'users', userId, 'profile', 'settings');
    await setDoc(profileRef, {
      selectedAvatar: avatarId,
      avatarGender: avatarGender,
      customAvatar: customAvatar,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save custom avatar data", error);
    return NextResponse.json({ error: 'Failed to save avatar data' }, { status: 500 });
  }
}
