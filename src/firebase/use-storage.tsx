'use client';

import { useFirebase } from '@/firebase';

export function useStorage() {
  const { storage } = useFirebase();
  return storage;
}
