'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';
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

    useEffect(() => {
        if (session) {
            const s = session as ExtendedSession;
            if (s.backendToken) {
                setBackendToken(s.backendToken);
            }
            if (s.user) {
                setAuthUser({
                    id: Number(s.user.id),
                    name: s.user.name || '',
                    email: s.user.email || '',
                    image: s.user.image || '',
                    role: s.user.role || 'citizen',
                });
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
                    return null;
                }
                return res.ok ? res.json() : null;
            })
            .then((data: Record<string, unknown> | null) => {
                if (data?.province_code) {
                    useAppStore.getState().setProvinceCode(data.province_code as string);
                }
            })
            .catch(() => {});
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
