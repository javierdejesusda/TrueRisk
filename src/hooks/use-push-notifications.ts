'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const provinceCode = useAppStore((s) => s.provinceCode);
  const backendToken = useAppStore((s) => s.backendToken);
  const setPushEnabled = useAppStore((s) => s.setPushEnabled);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setError('Service Workers not supported');
      return;
    }
    if (!('PushManager' in window)) {
      setError('Push API not supported');
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setError('Push not configured (missing VAPID key)');
      return;
    }
    setIsSupported(true);
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        const active = !!sub;
        setIsSubscribed(active);
        setPushEnabled(active);
      });
    });
  }, [setPushEnabled]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const key = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (!key || !auth) return false;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (backendToken) {
        headers['Authorization'] = `Bearer ${backendToken}`;
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
          },
          province_code: provinceCode,
        }),
      });
      if (!res.ok) throw new Error(`Subscribe failed: ${res.status}`);
      setIsSubscribed(true);
      setPushEnabled(true);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, provinceCode, backendToken, setPushEnabled]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      setIsSubscribed(false);
      setPushEnabled(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setPushEnabled]);

  return { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe };
}
