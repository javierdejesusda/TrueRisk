'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

export function useAuth() {
    const { data: session, status } = useSession();
    const setBackendToken = useAppStore((s) => s.setBackendToken);
    const setAuthUser = useAppStore((s) => s.setAuthUser);

    useEffect(() => {
        if (session) {
            const s = session as any;
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
        if (status !== 'authenticated' || !(session as any)?.backendToken) return;
        const token = (session as any).backendToken;
        fetch('/api/account/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.province_code) {
                    useAppStore.getState().setProvinceCode(data.province_code);
                }
            })
            .catch(() => {});
    }, [status, session]);

    return {
        user: session?.user || null,
        backendToken: (session as any)?.backendToken || null,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        signIn,
        signOut,
    };
}
