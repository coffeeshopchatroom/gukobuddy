'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { parseISO, addDays } from 'date-fns';

/**
 * A background component that monitors upcoming tasks and triggers
 * native browser notifications when a deadline is approaching.
 */
export function NotificationManager() {
  const { user } = useUser();
  const db = useFirestore();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check current permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen for permission changes via the Tasks page or other sources
  useEffect(() => {
    const checkPermission = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    window.addEventListener('focus', checkPermission);
    return () => window.removeEventListener('focus', checkPermission);
  }, []);

  const tasksQuery = useMemoFirebase(() => {
    // DO NOT monitor for anonymous users or if services aren't ready
    if (!user || user.isAnonymous || !db) return null;
    return query(
      collection(db, "users", user.uid, "tasks"),
      where("completed", "==", false),
      orderBy("dueDate", "asc")
    );
  }, [user, db]);

  const { data: tasks } = useCollection(tasksQuery);

  useEffect(() => {
    // Only proceed if permission is granted, we have active tasks, and user is not a guest
    if (permission === 'granted' && tasks && tasks.length > 0 && user && !user.isAnonymous) {
      const now = new Date();
      const next24Hours = addDays(now, 1);
      
      tasks.forEach(task => {
        const due = parseISO(task.dueDate);
        
        // If the task is due within the next 24 hours and is in the future
        if (due > now && due <= next24Hours) {
          // Use sessionStorage to prevent duplicate notifications in the same session
          const notifiedKey = `guko-notified-${task.id}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            new Notification(`upcoming deadline: ${task.title}`, {
              body: `this task is due ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
              icon: '/devmade-icons/gukologo.png', // Fallback to logo if available
              tag: task.id, // Group notifications for the same task
            });
            sessionStorage.setItem(notifiedKey, 'true');
          }
        }
      });
    }
  }, [tasks, permission, user]);

  return null;
}
