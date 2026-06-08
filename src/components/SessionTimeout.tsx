'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/lib/auth-actions';

export default function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 15 minutes inactivity duration (15 * 60 * 1000 ms = 900,000 ms)
  const TIMEOUT_DURATION = 15 * 60 * 1000;

  useEffect(() => {
    // Only monitor timeout on protected routes
    const isProtectedRoute = 
      pathname.startsWith('/user') || 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/exam');
      
    if (!isProtectedRoute) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleLogoutDueToInactivity, TIMEOUT_DURATION);
    };

    const handleLogoutDueToInactivity = async () => {
      try {
        await logoutAction();
        alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.');
        router.push('/login?reason=timeout');
        router.refresh();
      } catch (e) {
        console.error('Error logging out due to inactivity:', e);
      }
    };

    // Events to track user activity
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Register events
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    // Cleanup listeners
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, router]);

  return null;
}
