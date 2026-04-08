'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const LOADING_TIMEOUT_MS = 4000;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        if (!isLoading) return;
        const timer = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-bg-primary">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
            </div>
        );
    }

    if (isLoading && !timedOut) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-bg-primary">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
            </div>
        );
    }

    return <>{children}</>;
}
