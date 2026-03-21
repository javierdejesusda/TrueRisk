'use client';

import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function usePersonalizedSuggestions() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (provinceCode: string, locale: string) => {
      cancel();
      setContent('');
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const token = useAppStore.getState().backendToken;
      const headers: Record<string, string> = { Accept: 'text/event-stream' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(
          `${BACKEND}/api/v1/suggestions/stream/${provinceCode}?locale=${locale}`,
          { headers, signal: controller.signal },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('event: done')) {
              setIsStreaming(false);
              reader.cancel();
              return;
            }
            if (line.startsWith('event: error')) {
              const nextLine = lines[i + 1];
              const errorMsg =
                nextLine?.startsWith('data: ')
                  ? nextLine.slice(6)
                  : 'Stream error';
              setError(errorMsg);
              setIsStreaming(false);
              reader.cancel();
              return;
            }
            if (line.startsWith('data: ')) {
              const chunk = line.slice(6);
              setContent((prev) => prev + chunk);
            }
          }
        }

        setIsStreaming(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(
            (err as Error).message ||
              'Connection failed -- check that the backend is running',
          );
          setIsStreaming(false);
        }
      }
    },
    [cancel],
  );

  return { content, isStreaming, error, startStream, cancel };
}
