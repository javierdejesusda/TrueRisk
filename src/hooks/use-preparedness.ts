'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/app-store';

export interface ChecklistItem {
  item_key: string;
  label: string;
  description: string;
  category: string;
  completed: boolean;
  completed_at: string | null;
  priority: string;
}

export interface CategoryProgress {
  category: string;
  label: string;
  total_items: number;
  completed_items: number;
  score: number;
}

export interface PreparednessScore {
  total_score: number;
  categories: CategoryProgress[];
  next_actions: ChecklistItem[];
  last_updated: string | null;
}

export interface ChecklistResponse {
  categories: Record<string, ChecklistItem[]>;
  total_items: number;
  completed_items: number;
}

export interface ScoreHistoryEntry {
  total_score: number;
  computed_at: string;
}

/** Helper: fetch with explicit Bearer token (avoids Zustand hydration race) */
function authFetch(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(path, { ...options, headers });
}

export function usePreparedness() {
  const locale = useAppStore((s) => s.locale);
  const storeToken = useAppStore((s) => s.backendToken);
  const { data: session, status: sessionStatus } = useSession();
  // Use session token as fallback when Zustand store hasn't hydrated yet
  const backendToken = storeToken || (session as Record<string, unknown> | null)?.backendToken as string | null;
  const isAuthResolved = sessionStatus !== 'loading';
  const [score, setScore] = useState<PreparednessScore | null>(null);
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Keep a ref so callback closures always see the latest resolved token
  const tokenRef = useRef(backendToken);
  tokenRef.current = backendToken;

  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('preparedness:completed') ?? '{}');
      const result: Record<string, boolean> = {};
      for (const key of Object.keys(stored)) {
        result[key] = true;
      }
      return result;
    } catch {
      return {};
    }
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentToken = tokenRef.current;

      if (!currentToken) {
        // Without auth, only fetch the generic checklist
        try {
          const res = await fetch(`/api/preparedness/checklist?locale=${locale}`);
          if (res.ok) {
            const data = await res.json() as ChecklistResponse;
            setChecklist(data);
          }
        } catch {
          // Silently fall back to local fallback items
        }
        setIsLoading(false);
        return;
      }

      // Authenticated: fetch all three endpoints in parallel
      const results = await Promise.allSettled([
        authFetch(`/api/preparedness/score?locale=${locale}`, currentToken),
        authFetch(`/api/preparedness/checklist?locale=${locale}`, currentToken),
        authFetch('/api/preparedness/history', currentToken),
      ]);

      const [scoreResult, checklistResult, historyResult] = results;

      let hasAnyData = false;

      if (scoreResult.status === 'fulfilled' && scoreResult.value.ok) {
        const data = await scoreResult.value.json() as PreparednessScore;
        setScore(data);
        hasAnyData = true;
      }

      if (checklistResult.status === 'fulfilled' && checklistResult.value.ok) {
        const data = await checklistResult.value.json() as ChecklistResponse;
        setChecklist(data);
        hasAnyData = true;
      }

      if (historyResult.status === 'fulfilled' && historyResult.value.ok) {
        const data = await historyResult.value.json() as ScoreHistoryEntry[];
        setHistory(data);
      }

      if (!hasAnyData) {
        setError('Failed to fetch preparedness data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  }, [locale, backendToken]);

  useEffect(() => {
    if (!isAuthResolved) return; // Wait for auth to resolve before fetching
    fetchData();
  }, [fetchData, isAuthResolved]);

  const toggleItem = useCallback(async (itemKey: string, completed: boolean) => {
    // Save to localStorage as fallback (works even when API is down)
    try {
      const stored = JSON.parse(localStorage.getItem('preparedness:completed') ?? '{}');
      if (completed) {
        stored[itemKey] = new Date().toISOString();
      } else {
        delete stored[itemKey];
      }
      localStorage.setItem('preparedness:completed', JSON.stringify(stored));
    } catch {
      // localStorage unavailable
    }

    // Optimistic UI update for server-loaded checklist + score
    setChecklist((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, categories: { ...prev.categories } };
      for (const cat of Object.keys(updated.categories)) {
        updated.categories[cat] = updated.categories[cat].map((item) =>
          item.item_key === itemKey ? { ...item, completed } : item
        );
      }
      updated.completed_items = Object.values(updated.categories)
        .flat()
        .filter((i) => i.completed).length;
      updated.total_items = Object.values(updated.categories).flat().length;

      // Recompute score optimistically
      setScore((prevScore) => {
        if (!prevScore) return prevScore;
        const newCategories = prevScore.categories.map((cat) => {
          const catItems = updated.categories[cat.category] ?? [];
          const completedCount = catItems.filter((i) => i.completed).length;
          return { ...cat, completed_items: completedCount, score: catItems.length > 0 ? (completedCount / catItems.length) * 100 : 0 };
        });
        const weights: Record<string, number> = { kit: 0.25, plan: 0.25, alerts: 0.20, community: 0.15, knowledge: 0.15 };
        const newTotal = newCategories.reduce((sum, c) => sum + (c.score * (weights[c.category] ?? 0)), 0);
        return { ...prevScore, categories: newCategories, total_score: Math.round(newTotal * 10) / 10 };
      });

      return updated;
    });

    // Notify page of local toggle (for fallback mode)
    setLocalCompletions((prev) => {
      const next = { ...prev };
      if (completed) {
        next[itemKey] = true;
      } else {
        delete next[itemKey];
      }
      return next;
    });

    // Try to sync to backend
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const res = await authFetch(`/api/preparedness/items/${itemKey}`, currentToken, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) return; // Silently keep local state

      const scoreRes = await authFetch(`/api/preparedness/score?locale=${locale}`, currentToken);
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json() as PreparednessScore;
        setScore(scoreData);
      }
    } catch {
      // API down -- local state is already saved
    }
  }, [locale]);

  return { score, checklist, history, isLoading, error, toggleItem, refresh: fetchData, localCompletions };
}
