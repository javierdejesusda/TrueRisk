import type { SafetyStatus } from '@/hooks/use-safety-check';

export const STATUS_COLORS: Record<SafetyStatus, string> = {
  safe: 'bg-green-400',
  need_help: 'bg-red-400',
  evacuating: 'bg-orange-400',
  sheltering: 'bg-blue-400',
};

export const STATUS_LABELS: Record<SafetyStatus, string> = {
  safe: 'safe',
  need_help: 'needHelp',
  evacuating: 'evacuating',
  sheltering: 'sheltering',
};

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
