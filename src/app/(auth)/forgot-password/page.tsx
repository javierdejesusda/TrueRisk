'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
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

export default function ForgotPasswordPage() {
    const t = useTranslations('Auth');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
        } catch {
            // Always show success to prevent email enumeration
        } finally {
            setIsLoading(false);
            setSent(true);
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
                            <span className="text-text-primary">{t('forgotPasswordTitle')}</span>
                        </h2>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-text-muted text-xs"
                    >
                        {t('forgotPasswordDescription')}
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {sent ? (
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
                                    {t('resetLinkSent')}
                                </p>
                            </div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors duration-300">
                                    <ArrowLeft className="w-3 h-3" />
                                    {t('backToLogin')}
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
                            <motion.div
                                className={`relative ${focusedInput === 'email' ? 'z-10' : ''}`}
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                <div className="relative flex items-center overflow-hidden rounded-lg">
                                    <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${focusedInput === 'email' ? 'text-text-primary' : 'text-text-muted'}`} />
                                    <AnimatedInput
                                        type="email"
                                        placeholder={t('email')}
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedInput('email')}
                                        onBlur={() => setFocusedInput(null)}
                                        className="w-full bg-bg-secondary/60 border-border focus:border-border-hover text-text-primary placeholder:text-text-muted h-10 transition-all duration-300 pl-10 pr-3 focus:bg-bg-secondary"
                                    />
                                </div>
                            </motion.div>

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
                                                {t('sendResetLink')}
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
