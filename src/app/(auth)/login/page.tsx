'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
    nickname: z.string().min(1),
    password: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(data: LoginForm) {
        setError('');
        setLoading(true);
        try {
            const res = await signIn('credentials', {
                nickname: data.nickname,
                password: data.password,
                redirect: false,
            });
            if (res?.error) {
                setError(t('invalidCredentials'));
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError(t('invalidCredentials'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <div className="text-center">
                <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight">
                    <span className="text-text-primary">True</span>
                    <span className="text-accent-green">Risk</span>
                </h1>
                <p className="mt-2 text-sm text-text-secondary font-[family-name:var(--font-sans)]">
                    {t('login')}
                </p>
            </div>

            {/* Glass card */}
            <div className="w-full glass-heavy rounded-2xl p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <Input
                        label={t('nickname')}
                        type="text"
                        autoComplete="username"
                        error={errors.nickname?.message}
                        {...register('nickname')}
                    />
                    <Input
                        label={t('password')}
                        type="password"
                        autoComplete="current-password"
                        error={errors.password?.message}
                        {...register('password')}
                    />

                    {error && (
                        <p className="text-sm text-accent-red text-center">{error}</p>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="w-full mt-2 font-[family-name:var(--font-display)]"
                    >
                        {t('loginButton')}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-bg-primary px-3 text-xs text-text-muted font-[family-name:var(--font-sans)]">
                            {t('orContinueWith')}
                        </span>
                    </div>
                </div>

                {/* OAuth buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => signIn('google')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-all hover:bg-gray-100 cursor-pointer"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        {t('googleLogin')}
                    </button>

                    <button
                        type="button"
                        onClick={() => signIn('github')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#24292f] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#32383f] cursor-pointer"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                fillRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {t('githubLogin')}
                    </button>
                </div>
            </div>

            {/* Register link */}
            <p className="text-sm text-text-secondary font-[family-name:var(--font-sans)]">
                {t('noAccount')}{' '}
                <Link
                    href="/register"
                    className="text-accent-green hover:underline font-medium"
                >
                    {t('register')}
                </Link>
            </p>
        </div>
    );
}
