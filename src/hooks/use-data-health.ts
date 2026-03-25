'use client';

import { useState, useEffect } from 'react';

interface SourceHealth {
  last_success: string | null;
  last_failure: string | null;
  consecutive_failures: number;
  last_error_message: string | null;
  total_records_last_fetch: number;
}

export function useDataHealth() {
  const [sources, setSources] = useState<Record<string, SourceHealth>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/health')
      .then((r) => (r.ok ? r.json() : {}))
      .then(setSources)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { sources, isLoading };
}
