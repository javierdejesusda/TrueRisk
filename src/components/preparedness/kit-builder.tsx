'use client';

import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface KitBuilderProps {
  kitContent: string;
  isStreaming: boolean;
  onGenerate: () => void;
  evacNotes: string;
  onEvacNotesChange: (value: string) => void;
}

export function KitBuilder({ kitContent, isStreaming, onGenerate, evacNotes, onEvacNotesChange }: KitBuilderProps) {
  return (
    <Card variant="glass" padding="md">
      <h3 className="text-lg font-semibold text-text-primary mb-3">Emergency Kit & Notes</h3>
      <p className="text-sm text-text-muted mb-4">
        Get AI-powered kit recommendations personalized to your province hazards and household.
      </p>

      <Button onClick={onGenerate} disabled={isStreaming} variant="outline">
        <Sparkles className="w-4 h-4 mr-1.5" />
        {isStreaming ? 'Generating...' : 'AI Recommend Kit'}
      </Button>

      {kitContent && (
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 prose prose-sm prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed">
            {kitContent}
            {isStreaming && <span className="inline-block w-1.5 h-4 bg-accent-green animate-pulse ml-0.5" />}
          </div>
        </div>
      )}

      <div className="mt-6">
        <label className="text-sm font-semibold text-text-secondary block mb-2">
          Evacuation Notes
        </label>
        <textarea
          value={evacNotes}
          onChange={(e) => onEvacNotesChange(e.target.value)}
          placeholder="Add any evacuation notes, special instructions, or reminders..."
          className="w-full h-24 p-3 rounded-xl bg-white/[0.02] border border-white/10 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-green/30 transition-colors"
        />
      </div>
    </Card>
  );
}
