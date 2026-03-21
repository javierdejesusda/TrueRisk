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
import { Select } from '@/components/ui/select';
import { PROVINCES } from '@/lib/provinces';

export default function RegisterPage() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const registerSchema = z
        .object({
            nickname: z.string().min(1),
            email: z.string().email().optional().or(z.literal('')),
            password: z.string().min(8, t('passwordMin')),
            confirmPassword: z.string().min(1),
            province_code: z.string().min(1),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('passwordMismatch'),
            path: ['confirmPassword'],
        });

    type RegisterForm = z.infer<typeof registerSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            province_code: '28',
        },
    });

    const provinceOptions = PROVINCES.map((p) => ({
        value: p.code,
        label: p.name,
    }));

    async function onSubmit(data: RegisterForm) {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: data.nickname,
                    email: data.email || undefined,
                    password: data.password,
                    province_code: data.province_code,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                if (body?.detail?.includes('nickname')) {
                    setError(t('nicknameTaken'));
                } else if (body?.detail?.includes('email')) {
                    setError(t('emailTaken'));
                } else {
                    setError(body?.detail || 'Registration failed');
                }
                setLoading(false);
                return;
            }

            // Auto sign in after registration
            const signInRes = await signIn('credentials', {
                nickname: data.nickname,
                password: data.password,
                redirect: false,
            });

            if (signInRes?.error) {
                // Registration succeeded but auto-login failed, redirect to login
                router.push('/login');
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError('Registration failed');
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
                    {t('register')}
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
                        label={t('emailOptional')}
                        type="email"
                        autoComplete="email"
                        error={errors.email?.message}
                        {...register('email')}
                    />
                    <Input
                        label={t('password')}
                        type="password"
                        autoComplete="new-password"
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <Input
                        label={t('confirmPassword')}
                        type="password"
                        autoComplete="new-password"
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />
                    <Select
                        label={t('province')}
                        options={provinceOptions}
                        error={errors.province_code?.message}
                        {...register('province_code')}
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
                        {t('registerButton')}
                    </Button>
                </form>
            </div>

            {/* Login link */}
            <p className="text-sm text-text-secondary font-[family-name:var(--font-sans)]">
                {t('haveAccount')}{' '}
                <Link
                    href="/login"
                    className="text-accent-green hover:underline font-medium"
                >
                    {t('login')}
                </Link>
            </p>
        </div>
    );
}
