'use client';

import { Bot, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  // locally generated id for keying
  id: string;
  // when assistant returns ok=false, store the error here
  error?: boolean;
}

const DISCLAIMER = 'AI-generated answers — verify against your textbook.';

const SUGGESTIONS = [
  'What is the difference between == and = ?',
  'Explain list slicing with an example.',
  'How do I check if a key exists in a dictionary?',
  'Predict the output of: print(2 ** 3 ** 2)',
];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `m${idCounter}-${Date.now()}`;
}

export function TutorChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, loading]);

  // Focus input when opening.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed, id: nextId() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send the trimmed conversation — just role + content.
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const errText = data?.error ?? 'Request failed. Please try again.';
        setMessages((cur) => [
          ...cur,
          { role: 'assistant', content: errText, id: nextId(), error: true },
        ]);
      } else {
        setMessages((cur) => [
          ...cur,
          { role: 'assistant', content: data.reply as string, id: nextId() },
        ]);
      }
    } catch {
      setMessages((cur) => [
        ...cur,
        {
          role: 'assistant',
          content: 'Network error. Please check your connection and try again.',
          id: nextId(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close Mehru Tutor AI' : 'Open Mehru Tutor AI'}
        aria-expanded={open}
        className={cn(
          'fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lift ring-1 ring-primary/30 transition-all hover:scale-110 hover:rotate-3 active:scale-95',
          open && 'rotate-90'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold ring-2 ring-background">
            AI
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Mehru Tutor AI chat"
          className="fixed bottom-24 right-5 z-50 w-[min(24rem,calc(100vw-2.5rem))] h-[min(34rem,calc(100vh-8rem))] flex flex-col rounded-3xl glass-strong shadow-lift border-gradient overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-gradient-to-br from-primary to-accent text-primary-foreground px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">Mehru Tutor AI</div>
                <div className="text-[10px] text-primary-foreground/80 truncate">
                  Restricted to Chapters 1–40
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground h-8 w-8 p-0"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20">
            {messages.length === 0 ? (
              <div className="space-y-3 pt-2">
                <div className="rounded-lg bg-card border p-3 text-sm">
                  <p className="font-medium mb-1">Salam! Main Mehru Tutor AI hu.</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Aap Python ke Chapters 1–40 ke baare mein sawaal pooch sakti ho — print,
                    variables, conditions, lists, tuples, loops, input/strings, aur dictionaries.
                    Suggestion tap kar ke shuru karo, ya apna sawaal neeche type karo.
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground italic">{DISCLAIMER}</p>
                </div>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full text-left rounded-lg border bg-card px-3 py-2 text-xs hover:bg-accent hover:border-primary/40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex',
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : m.error
                        ? 'bg-destructive/10 border border-destructive/30 rounded-bl-sm'
                        : 'bg-card border rounded-bl-sm'
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-card border px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>•</span>
                  </span>
                  <span className="ml-2 text-xs">thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            className="border-t bg-card p-2 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Python (Ch 1–40)…"
              maxLength={800}
              disabled={loading}
              aria-label="Type your question"
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="px-3 pb-2 bg-card flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] font-normal">
              {DISCLAIMER}
            </Badge>
            <button
              onClick={() => setMessages([])}
              className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
              type="button"
            >
              Clear chat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
