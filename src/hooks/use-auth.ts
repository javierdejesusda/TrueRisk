'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import type { UserProfile } from '@/types/user';

export function useAuth() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            router.replace('/login');
          }
          return;
        }

        const json = await res.json() as { user: UserProfile };
        if (!cancelled) {
          if (json.user) {
            setUser(json.user);
          } else {
            setUser(null);
            router.replace('/login');
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          router.replace('/login');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!user) {
      checkSession();
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user, setUser, router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors -- clear locally regardless
    }
    setUser(null);
    router.replace('/login');
  }, [setUser, router]);

  return { user, isLoading, logout };
}
