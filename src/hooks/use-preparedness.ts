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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [scoreRes, checklistRes, historyRes] = await Promise.all([
        apiFetch(`/api/preparedness/score?locale=${locale}`),
        apiFetch(`/api/preparedness/checklist?locale=${locale}`),
        apiFetch('/api/preparedness/history'),
      ]);

      if (!scoreRes.ok || !checklistRes.ok || !historyRes.ok) {
        throw new Error('Failed to fetch preparedness data');
      }

      const [scoreData, checklistData, historyData] = await Promise.all([
        scoreRes.json() as Promise<PreparednessScore>,
        checklistRes.json() as Promise<ChecklistResponse>,
        historyRes.json() as Promise<ScoreHistoryEntry[]>,
      ]);

      setScore(scoreData);
      setChecklist(checklistData);
      setHistory(historyData);
      setError(null);
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
    // Optimistic UI update
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

    try {
      const res = await apiFetch(`/api/preparedness/items/${itemKey}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Refresh score after toggle
      const scoreRes = await apiFetch(`/api/preparedness/score?locale=${locale}`);
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json() as PreparednessScore;
        setScore(scoreData);
      }
    } catch {
      // Revert on error
      fetchData();
    }
  }, [locale, fetchData]);

  return { score, checklist, history, isLoading, error, toggleItem, refresh: fetchData };
}
