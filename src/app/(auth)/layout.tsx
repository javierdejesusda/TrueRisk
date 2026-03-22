'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);

    if (isLoading || isAuthenticated) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-bg-primary">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
            </div>
        );
    }

    return <>{children}</>;
}
