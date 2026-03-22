'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
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

export function usePreparedness() {
  const locale = useAppStore((s) => s.locale);
  const [score, setScore] = useState<PreparednessScore | null>(null);
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      const results = await Promise.allSettled([
        apiFetch(`/api/preparedness/score?locale=${locale}`),
        apiFetch(`/api/preparedness/checklist?locale=${locale}`),
        apiFetch('/api/preparedness/history'),
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
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

    // Optimistic UI update for server-loaded checklist
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
    try {
      const res = await apiFetch(`/api/preparedness/items/${itemKey}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) return; // Silently keep local state

      const scoreRes = await apiFetch(`/api/preparedness/score?locale=${locale}`);
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
