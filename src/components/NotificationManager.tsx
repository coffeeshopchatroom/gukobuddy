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
    // DO NOT monitor for anonymous users if you want to avoid permission noise,
    // though the rules allow it. We primarily monitor for registered users.
    if (!user || !db) return null;
    return query(
      collection(db, "users", user.uid, "tasks"),
      where("completed", "==", false),
      orderBy("dueDate", "asc")
    );
  }, [user, db]);

  // We pass a local error handler to useCollection if we want to suppress the global crash,
  // but since we're using the standard hook, we'll just handle the data being null/error gracefully.
  const { data: tasks, error } = useCollection(tasksQuery);

  useEffect(() => {
    // If there's an index error or permission error in the background, we just log it
    // rather than letting it bubble up to the global error listener which crashes the app.
    if (error) {
      console.warn("NotificationManager: background query failed. This usually means a composite index is missing.", error);
      return;
    }

    // Only proceed if permission is granted and we have active tasks
    if (permission === 'granted' && tasks && tasks.length > 0 && user) {
      const now = new Date();
      const next24Hours = addDays(now, 1);
      
      tasks.forEach(task => {
        const due = parseISO(task.dueDate);
        
        // If the task is due within the next 24 hours and is in the future
        if (due > now && due <= next24Hours) {
          const notifiedKey = `guko-notified-${task.id}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            try {
              new Notification(`upcoming deadline: ${task.title}`, {
                body: `this task is due ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
                icon: '/devmade-icons/gukologo.png',
                tag: task.id,
              });
              sessionStorage.setItem(notifiedKey, 'true');
            } catch (e) {
              console.error("Failed to trigger native notification", e);
            }
          }
        }
      });
    }
  }, [tasks, error, permission, user]);

  return null;
}
