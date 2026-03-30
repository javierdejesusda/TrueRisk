'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeClosed, ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthCardBackground, AuthCard } from '@/components/ui/auth-card';

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

function ResetPasswordForm() {
    const t = useTranslations('Auth');
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mismatchError, setMismatchError] = useState('');
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMismatchError('');

        if (newPassword !== confirmPassword) {
            setMismatchError(t('passwordMismatch'));
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword }),
            });
            if (res.ok) {
                setResult('success');
            } else {
                setResult('error');
            }
        } catch {
            setResult('error');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthCardBackground>
            <AuthCard>
                <div className="text-center space-y-1 mb-5">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                    >
                        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-tight">
                            <span className="text-text-primary">{t('resetPasswordTitle')}</span>
                        </h2>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-text-muted text-xs"
                    >
                        {t('resetPasswordDescription')}
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {result === 'success' ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex flex-col items-center gap-3 py-4">
                                <CheckCircle className="w-10 h-10 text-accent-green" />
                                <p className="text-sm text-text-secondary text-center leading-relaxed">
                                    {t('resetSuccess')}
                                </p>
                            </div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors duration-300">
                                    <ArrowLeft className="w-3 h-3" />
                                    {t('backToLogin')}
                                </Link>
                            </motion.div>
                        </motion.div>
                    ) : result === 'error' ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex flex-col items-center gap-3 py-4">
                                <XCircle className="w-10 h-10 text-accent-red" />
                                <p className="text-sm text-text-secondary text-center leading-relaxed">
                                    {t('resetFailed')}
                                </p>
                            </div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                <Link href="/forgot-password" className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors duration-300">
                                    <ArrowLeft className="w-3 h-3" />
                                    {t('forgotPasswordTitle')}
                                </Link>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={onSubmit}
                            className="space-y-4"
                        >
                            <motion.div className="space-y-3">
                                <motion.div
                                    className={`relative ${focusedInput === 'password' ? 'z-10' : ''}`}
                                    whileHover={{ scale: 1.01 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                    <div className="relative flex items-center overflow-hidden rounded-lg">
                                        <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'password' ? 'text-text-primary' : 'text-text-muted'}`} />
                                        <AnimatedInput
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={t('newPassword')}
                                            autoComplete="new-password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            onFocus={() => setFocusedInput('password')}
                                            onBlur={() => setFocusedInput(null)}
                                            className="w-full bg-bg-secondary/60 border-border focus:border-border-hover text-text-primary placeholder:text-text-muted h-10 transition-all duration-300 pl-10 pr-10 focus:bg-bg-secondary"
                                        />
                                        <div onClick={() => setShowPassword(!showPassword)} className="absolute right-3 cursor-pointer">
                                            {showPassword ? (
                                                <Eye className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors duration-300" />
                                            ) : (
                                                <EyeClosed className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors duration-300" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className={`relative ${focusedInput === 'confirm' ? 'z-10' : ''}`}
                                    whileHover={{ scale: 1.01 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                    <div className="relative flex items-center overflow-hidden rounded-lg">
                                        <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'confirm' ? 'text-text-primary' : 'text-text-muted'}`} />
                                        <AnimatedInput
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder={t('confirmNewPassword')}
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onFocus={() => setFocusedInput('confirm')}
                                            onBlur={() => setFocusedInput(null)}
                                            className="w-full bg-bg-secondary/60 border-border focus:border-border-hover text-text-primary placeholder:text-text-muted h-10 transition-all duration-300 pl-10 pr-10 focus:bg-bg-secondary"
                                        />
                                        <div onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 cursor-pointer">
                                            {showConfirm ? (
                                                <Eye className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors duration-300" />
                                            ) : (
                                                <EyeClosed className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors duration-300" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {mismatchError && (
                                <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-accent-red text-center">
                                    {mismatchError}
                                </motion.p>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full relative group/button mt-3"
                            >
                                <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />
                                <div className="relative overflow-hidden bg-text-primary text-bg-primary font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center font-[family-name:var(--font-display)]">
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -z-10"
                                        animate={{ x: ['-100%', '100%'] }}
                                        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                                        style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                                    />
                                    <AnimatePresence mode="wait">
                                        {isLoading ? (
                                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-bg-primary/70 border-t-transparent rounded-full animate-spin" />
                                            </motion.div>
                                        ) : (
                                            <motion.span key="button-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 text-sm font-medium">
                                                {t('resetPassword')}
                                                <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.button>

                            <motion.p className="text-center text-xs text-text-secondary mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                <Link href="/login" className="relative inline-block group/back">
                                    <span className="relative z-10 text-text-muted group-hover/back:text-text-primary transition-colors duration-300 flex items-center justify-center gap-1.5">
                                        <ArrowLeft className="w-3 h-3" />
                                        {t('backToLogin')}
                                    </span>
                                </Link>
                            </motion.p>
                        </motion.form>
                    )}
                </AnimatePresence>
            </AuthCard>
        </AuthCardBackground>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <AuthCardBackground>
                <AuthCard>
                    <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                    </div>
                </AuthCard>
            </AuthCardBackground>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
