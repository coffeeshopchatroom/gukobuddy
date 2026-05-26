'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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

  // Listen for permission changes
  useEffect(() => {
    const checkPermission = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    window.addEventListener('focus', checkPermission);
    return () => window.removeEventListener('focus', checkPermission);
  }, []);

  // Use a simple query to avoid composite index requirements in the background
  const tasksQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "users", user.uid, "tasks"),
      orderBy("dueDate", "asc")
    );
  }, [user, db]);

  const { data: allTasks, error } = useCollection(tasksQuery);

  useEffect(() => {
    if (error) {
      console.warn("NotificationManager: background query failed.", error);
      return;
    }

    // Only proceed if permission is granted and we have active tasks
    if (permission === 'granted' && allTasks && allTasks.length > 0 && user) {
      const now = new Date();
      const next24Hours = addDays(now, 1);
      
      // Filter for incomplete tasks in memory
      const activeTasks = allTasks.filter(t => !t.completed);
      
      activeTasks.forEach(task => {
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
  }, [allTasks, error, permission, user]);

  return null;
}
