'use client';

import { useState, useCallback, useRef } from 'react';

export function useAiSummary() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const receivedData = useRef(false);

  const cancel = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    (provinceCode: string, locale: string) => {
      cancel();
      setContent('');
      setError(null);
      setIsStreaming(true);
      receivedData.current = false;

      const es = new EventSource(
        `/api/ai-summary/stream/${provinceCode}?locale=${locale}`
      );
      esRef.current = es;

      es.addEventListener('delta', (e: MessageEvent) => {
        receivedData.current = true;
        setContent((prev) => prev + e.data);
      });

      es.addEventListener('done', () => {
        es.close();
        esRef.current = null;
        setIsStreaming(false);
      });

      es.addEventListener('error', (e: MessageEvent) => {
        setError(e.data || 'Failed to generate summary');
        es.close();
        esRef.current = null;
        setIsStreaming(false);
      });

      es.onerror = () => {
        if (esRef.current === es) {
          es.close();
          esRef.current = null;
          setIsStreaming(false);
          if (!receivedData.current) {
            setError('Connection failed — check that the backend is running');
          }
        }
      };
    },
    [cancel]
  );

  return { content, isStreaming, error, startStream, cancel };
}
