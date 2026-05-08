export type DisabledFeature =
  | 'ai_summary'
  | 'chat'
  | 'suggestions'
  | 'narrative'
  | 'emergency_plan';

const disabledSet: ReadonlySet<string> = new Set(
  (process.env.NEXT_PUBLIC_DISABLED_FEATURES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

export function isFeatureDisabled(name: DisabledFeature): boolean {
  return disabledSet.has(name);
}
