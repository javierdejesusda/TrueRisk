'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeClosed, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthCardBackground, AuthCard } from '@/components/ui/auth-card';
import { PROVINCES } from '@/lib/provinces';

function AnimatedInput({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            className={cn(
                'flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] placeholder:text-text-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                'focus-visible:border-border-hover focus-visible:ring-border-hover/50 focus-visible:ring-[3px]',
                className
            )}
            {...props}
        />
    );
}

export default function RegisterPage() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

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
        watch,
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { province_code: '28' },
    });

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

            const signInRes = await signIn('credentials', {
                nickname: data.nickname,
                password: data.password,
                redirect: false,
            });

            if (signInRes?.error) {
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
        <AuthCardBackground>
            <AuthCard maxWidth="max-w-md">
                <div className="text-center space-y-1 mb-5">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                    >
                        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-tight">
                            <span className="text-text-primary">True</span>
                            <span className="text-accent-blue">Risk</span>
                        </h2>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-text-muted text-xs"
                    >
                        {t('register')}
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <motion.div
                        className={`relative ${focusedInput === 'nickname' ? 'z-10' : ''}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                            <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'nickname' ? 'text-text-primary' : 'text-text-muted'}`} />
                            <AnimatedInput
                                type="text"
                                placeholder={t('nickname')}
                                autoComplete="username"
                                {...register('nickname')}
                                onFocus={() => setFocusedInput('nickname')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full bg-bg-secondary/60 border-border focus:border-border-hover text-text-primary h-10 pl-10 pr-3 focus:bg-bg-secondary"
                            />
                        </div>
                        {errors.nickname && <p className="text-xs text-accent-red mt-1">{errors.nickname.message}</p>}
                    </motion.div>

                    <motion.div
                        className={`relative ${focusedInput === 'email' ? 'z-10' : ''}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                            <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'email' ? 'text-text-primary' : 'text-text-muted'}`} />
                            <AnimatedInput
                                type="email"
                                placeholder={t('emailOptional')}
                                autoComplete="email"
                                {...register('email')}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full bg-bg-secondary/60 border-border focus:border-border-hover text-text-primary h-10 pl-10 pr-3 focus:bg-bg-secondary"
                            />
                        </div>
                        {errors.email && <p className="text-xs text-accent-red mt-1">{errors.email.message}</p>}
                    </motion.div>

                    <motion.div
                        className={`relative ${focusedInput === 'password' ? 'z-10' : ''}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                            <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'password' ? 'text-text-primary' : 'text-text-muted'}`} />
                            <AnimatedInput
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('password')}
                                autoComplete="new-password"
                                {...register('password')}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full bg-bg-secondary/60 border-border focus:border-border-hover text-text-primary h-10 pl-10 pr-10 focus:bg-bg-secondary"
                            />
                            <div onClick={() => setShowPassword(!showPassword)} className="absolute right-3 cursor-pointer">
                                {showPassword ? <Eye className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" /> : <EyeClosed className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" />}
                            </div>
                        </div>
                        {errors.password && <p className="text-xs text-accent-red mt-1">{errors.password.message}</p>}
                    </motion.div>

                    <motion.div
                        className={`relative ${focusedInput === 'confirmPassword' ? 'z-10' : ''}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                            <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'confirmPassword' ? 'text-text-primary' : 'text-text-muted'}`} />
                            <AnimatedInput
                                type={showConfirm ? 'text' : 'password'}
                                placeholder={t('confirmPassword')}
                                autoComplete="new-password"
                                {...register('confirmPassword')}
                                onFocus={() => setFocusedInput('confirmPassword')}
                                onBlur={() => setFocusedInput(null)}
                                className="w-full bg-bg-secondary/60 border-border focus:border-border-hover text-text-primary h-10 pl-10 pr-10 focus:bg-bg-secondary"
                            />
                            <div onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 cursor-pointer">
                                {showConfirm ? <Eye className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" /> : <EyeClosed className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" />}
                            </div>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-accent-red mt-1">{errors.confirmPassword.message}</p>}
                    </motion.div>

                    <motion.div
                        className={`relative ${focusedInput === 'province' ? 'z-10' : ''}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                            <MapPin className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'province' ? 'text-text-primary' : 'text-text-muted'}`} />
                            <select
                                {...register('province_code')}
                                onFocus={() => setFocusedInput('province')}
                                onBlur={() => setFocusedInput(null)}
                                className="flex h-10 w-full min-w-0 rounded-md border bg-bg-secondary/60 border-border pl-10 pr-3 py-1 text-sm text-text-primary outline-none transition-[color,box-shadow] focus:border-border-hover focus:bg-bg-secondary focus-visible:ring-border-hover/50 focus-visible:ring-[3px] appearance-none cursor-pointer"
                            >
                                {PROVINCES.map((p) => (
                                    <option key={p.code} value={p.code}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 pointer-events-none">
                                <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {errors.province_code && <p className="text-xs text-accent-red mt-1">{errors.province_code.message}</p>}
                    </motion.div>

                    {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-accent-red text-center">
                            {error}
                        </motion.p>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full relative group/button mt-3"
                    >
                        <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />
                        <div className="relative overflow-hidden bg-text-primary text-bg-primary font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center font-[family-name:var(--font-display)]">
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -z-10"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                                style={{ opacity: loading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                            />
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-bg-primary/70 border-t-transparent rounded-full animate-spin" />
                                    </motion.div>
                                ) : (
                                    <motion.span key="button-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 text-sm font-medium">
                                        {t('registerButton')}
                                        <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.button>

                    <motion.p className="text-center text-xs text-text-secondary mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        {t('haveAccount')}{' '}
                        <Link href="/login" className="relative inline-block group/login">
                            <span className="relative z-10 text-text-primary group-hover/login:text-text-secondary transition-colors duration-300 font-medium">
                                {t('login')}
                            </span>
                            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-text-primary group-hover/login:w-full transition-all duration-300" />
                        </Link>
                    </motion.p>
                </form>
            </AuthCard>
        </AuthCardBackground>
    );
}
