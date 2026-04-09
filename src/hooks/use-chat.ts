'use client';

import { useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import * as Sentry from '@sentry/nextjs';
import { useAppStore } from '@/store/app-store';
import { useChatStore } from '@/store/chat-store';
import type { ChatUsage } from '@/store/chat-store';

/** Resolve backend token with session fallback (avoids Zustand hydration race). */
function resolveToken(session: ReturnType<typeof useSession>['data']): string | null {
  const storeToken = useAppStore.getState().backendToken;
  if (storeToken) return storeToken;
  return (session as Record<string, unknown> | null)?.backendToken as string | null;
}

function getAuthHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function useChat() {
  const { data: session } = useSession();
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const token = resolveToken(sessionRef.current);
      const res = await fetch('/api/chat/usage', {
        headers: getAuthHeaders(token),
      });
      if (!res.ok) return;
      const data = await res.json();
      const usage: ChatUsage = {
        messagesToday: data.messages_today,
        messagesLimitHourly: data.messages_limit_hourly,
        messagesLimitDaily: data.messages_limit_daily,
        tokensToday: data.tokens_today,
        tokensLimitDaily: data.tokens_limit_daily,
        tokensMonth: data.tokens_month,
        tokensLimitMonthly: data.tokens_limit_monthly,
        canSend: data.can_send,
        nextAvailableAt: data.next_available_at ?? null,
      };
      useChatStore.getState().setUsage(usage);
    } catch {
      // silently ignore usage fetch errors
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      if (trimmed.length > 500) {
        useChatStore.getState().setError('Message must be 500 characters or fewer.');
        return;
      }

      const store = useChatStore.getState();
      store.setError(null);
      store.setStreaming(true);

      // Optimistically add user message
      const userMsg = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      store.addMessage(userMsg);

      // Add empty assistant placeholder
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: '',
        createdAt: new Date().toISOString(),
      };
      store.addMessage(assistantMsg);

      const { conversationId } = useChatStore.getState();
      const { locale } = useAppStore.getState();

      cancel();
      const controller = new AbortController();
      abortRef.current = controller;
      let token = resolveToken(sessionRef.current);

      const doFetch = (t: string | null) =>
        fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(t),
          },
          body: JSON.stringify({
            message: trimmed,
            conversation_id: conversationId,
            locale,
          }),
          signal: controller.signal,
        });

      try {
        let res = await doFetch(token);

        // Refresh token on 401 and retry once
        if (res.status === 401 && token) {
          const { getSession, signOut } = await import('next-auth/react');
          const fresh = await getSession();
          const newToken = (fresh as Record<string, unknown> | null)
            ?.backendToken as string | undefined;
          if (newToken && newToken !== token) {
            token = newToken;
            useAppStore.getState().setBackendToken(newToken);
            res = await doFetch(newToken);
          } else {
            // Token refresh failed — session is dead, force re-login
            signOut({ callbackUrl: '/login' });
            return;
          }
        }

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let pendingEvent: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].replace(/\r$/, '');

            if (line.startsWith('event: ')) {
              pendingEvent = line.slice(7).trim();
              continue;
            }

            if (line.startsWith('data: ') || line === 'data:') {
              const data = line.startsWith('data: ') ? line.slice(6) : '';

              if (pendingEvent === 'conversation_id') {
                useChatStore.getState().setConversationId(data);
                pendingEvent = null;
                continue;
              }

              if (pendingEvent === 'delta') {
                useChatStore.getState().appendToLastAssistant(data);
                pendingEvent = null;
                continue;
              }

              if (pendingEvent === 'done') {
                useChatStore.getState().setStreaming(false);
                reader.cancel();
                await fetchUsage();
                return;
              }

              if (pendingEvent === 'error') {
                useChatStore.getState().setError(data || 'Stream error');
                // Remove empty assistant placeholder
                useChatStore.setState((s) => {
                  const msgs = [...s.messages];
                  const last = msgs[msgs.length - 1];
                  if (last?.role === 'assistant' && last.content === '') {
                    msgs.pop();
                  }
                  return { messages: msgs, isStreaming: false };
                });
                reader.cancel();
                return;
              }

              // Plain data line without a preceding event — treat as delta
              if (pendingEvent === null) {
                useChatStore.getState().appendToLastAssistant(data);
              }

              pendingEvent = null;
            } else if (line === '') {
              // SSE blank line separates events; reset pending event
              pendingEvent = null;
            }
          }
        }

        useChatStore.getState().setStreaming(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        Sentry.captureException(err, {
          tags: { feature: 'chat' },
          extra: { conversationId: useChatStore.getState().conversationId },
        });
        useChatStore.getState().setError((err as Error).message || 'Connection failed');
        useChatStore.setState((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant' && last.content === '') {
            msgs.pop();
          }
          return { messages: msgs, isStreaming: false };
        });
      }
    },
    [cancel, fetchUsage],
  );

  const startNewConversation = useCallback(async () => {
    cancel();
    useChatStore.getState().clearMessages();

    try {
      const token = resolveToken(sessionRef.current);
      const res = await fetch('/api/chat/new-conversation', {
        method: 'POST',
        headers: getAuthHeaders(token),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.conversation_id) {
        useChatStore.getState().setConversationId(data.conversation_id);
      }
    } catch {
      // silently ignore
    }
  }, [cancel]);

  return { sendMessage, cancel, fetchUsage, startNewConversation };
}
