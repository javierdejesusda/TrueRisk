'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useAppStore } from '@/store/app-store';

interface ExtendedSession {
    backendToken?: string;
    user?: {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

export function useAuth() {
    const { data: session, status } = useSession();
    const setBackendToken = useAppStore((s) => s.setBackendToken);
    const setAuthUser = useAppStore((s) => s.setAuthUser);
    const signOutFiredRef = useRef(false);

    useEffect(() => {
        if (session) {
            const s = session as ExtendedSession;
            if (s.backendToken) {
                signOutFiredRef.current = false;
                setBackendToken(s.backendToken);
                if (s.user) {
                    setAuthUser({
                        id: Number(s.user.id),
                        name: s.user.name || '',
                        email: s.user.email || '',
                        image: s.user.image || '',
                        role: s.user.role || 'citizen',
                    });
                }
            } else if (!signOutFiredRef.current) {
                // Session exists but backendToken is null — token refresh failed.
                // Sign out to force re-login instead of staying in a broken state
                // where the user sees "Session expired" on every action.
                signOutFiredRef.current = true;
                setBackendToken(null);
                setAuthUser(null);
                signOut({ callbackUrl: '/login' });
            }
        } else if (status === 'unauthenticated') {
            setBackendToken(null);
            setAuthUser(null);
        }
    }, [session, status, setBackendToken, setAuthUser]);

    useEffect(() => {
        const s = session as ExtendedSession | null;
        if (status !== 'authenticated' || !s?.backendToken) return;
        fetch('/api/account/me', {
            headers: { Authorization: `Bearer ${s.backendToken}` },
        })
            .then((res) => {
                if (res.status === 401) {
                    setBackendToken(null);
                    setAuthUser(null);
                    signOut({ callbackUrl: '/login' });
                    return null;
                }
                return res.ok ? res.json() : null;
            })
            .then((data: Record<string, unknown> | null) => {
                if (data?.province_code) {
                    useAppStore.getState().setProvinceCode(data.province_code as string);
                }
            })
            .catch((err: unknown) => { Sentry.captureException(err, { level: 'warning', tags: { feature: 'auth' } }); });
    }, [status, session, setBackendToken, setAuthUser]);

    const ext = session as ExtendedSession | null;

    return {
        user: session?.user || null,
        backendToken: ext?.backendToken || null,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        signIn,
        signOut,
    };
}
