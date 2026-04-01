'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  const t = useTranslations('NotFound');
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <Card variant="glass-heavy" padding="lg" className="max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="text-6xl font-display font-bold text-text-primary">
            404
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
              {t('title')}
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              {t('description')}
            </p>
          </div>
          <Link href="/map" className="w-full">
            <Button variant="primary" size="lg" className="w-full">
              {t('goToMap')}
            </Button>
          </Link>
          <p className="text-text-secondary text-xs">
            {t('redirecting', { seconds: countdown })}
          </p>
        </div>
      </Card>
    </div>
  );
}
