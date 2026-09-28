'use client';

import { useState } from 'react';
import { Check, Copy, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: 'python' | 'text';
  output?: string;
  showOutputToggle?: boolean; // if true, hide output behind a "reveal" button
  className?: string;
}

/**
 * Lightweight syntax highlighter for Python.
 * Avoids pulling react-syntax-highlighter (heavy) — we tokenize line by line.
 * Covers: comments, strings, numbers, keywords, builtins, operators.
 */
function highlight(code: string): string {
  const KEYWORDS = new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not',
    'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield',
  ]);
  const BUILTINS = new Set([
    'print', 'len', 'range', 'int', 'float', 'str', 'list', 'tuple', 'dict',
    'set', 'bool', 'input', 'type', 'sum', 'min', 'max', 'abs', 'enumerate',
    'zip', 'map', 'filter', 'sorted', 'reversed', 'isinstance', 'getattr',
    'setattr', 'hasattr', 'ord', 'chr', 'round', 'open', 'format',
  ]);

  // Escape HTML first
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process line by line so we can stop a comment from spilling across lines.
  const lines = escaped.split('\n');
  const out: string[] = [];

  for (const line of lines) {
    let i = 0;
    let result = '';
    while (i < line.length) {
      const ch = line[i];
      // Comment
      if (ch === '#') {
        result += `<span class="text-muted-foreground italic">${line.slice(i)}</span>`;
        break;
      }
      // Triple-quoted strings
      if (ch === '"' || ch === "'") {
        // check for triple
        if (line.slice(i, i + 3) === ch.repeat(3)) {
          const closeIdx = line.indexOf(ch.repeat(3), i + 3);
          const end = closeIdx === -1 ? line.length : closeIdx + 3;
          result += `<span class="text-emerald-600 dark:text-emerald-400">${line.slice(i, end)}</span>`;
          i = end;
          continue;
        }
        // single string
        let end = i + 1;
        while (end < line.length && line[end] !== ch) {
          if (line[end] === '\\' && end + 1 < line.length) end += 2;
          else end += 1;
        }
        end = Math.min(end + 1, line.length);
        result += `<span class="text-emerald-600 dark:text-emerald-400">${line.slice(i, end)}</span>`;
        i = end;
        continue;
      }
      // Number
      if (/[0-9]/.test(ch)) {
        let end = i;
        while (end < line.length && /[0-9._eE]/.test(line[end])) end += 1;
        result += `<span class="text-amber-600 dark:text-amber-400">${line.slice(i, end)}</span>`;
        i = end;
        continue;
      }
      // Identifier / keyword / builtin
      if (/[A-Za-z_]/.test(ch)) {
        let end = i;
        while (end < line.length && /[A-Za-z0-9_]/.test(line[end])) end += 1;
        const word = line.slice(i, end);
        if (KEYWORDS.has(word)) {
          result += `<span class="text-purple-600 dark:text-purple-400 font-semibold">${word}</span>`;
        } else if (BUILTINS.has(word)) {
          result += `<span class="text-sky-600 dark:text-sky-400">${word}</span>`;
        } else if (line[end] === '(') {
          result += `<span class="text-foreground">${word}</span>`;
        } else {
          result += word;
        }
        i = end;
        continue;
      }
      // Operators
      if (/[+\-*/%=<>!&|^~]/.test(ch)) {
        let end = i;
        while (end < line.length && /[+\-*/%=<>!&|^~]/.test(line[end])) end += 1;
        result += `<span class="text-pink-600 dark:text-pink-400">${line.slice(i, end)}</span>`;
        i = end;
        continue;
      }
      result += ch;
      i += 1;
    }
    out.push(result);
  }
  return out.join('\n');
}

export function CodeBlock({
  code,
  language = 'python',
  output,
  showOutputToggle = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  };

  const showOutput = output && (!showOutputToggle || revealed);

  return (
    <div className={cn('rounded-lg border bg-muted/40 overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-xs uppercase text-muted-foreground">{language}</span>
        <div className="flex items-center gap-1">
          {showOutputToggle && output && !revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent"
              aria-label="Reveal output"
            >
              <Eye className="h-3.5 w-3.5" /> Reveal output
            </button>
          )}
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code
          className="font-mono"
          // Highlighted HTML is generated locally and escaped; safe to inject.
          dangerouslySetInnerHTML={{ __html: highlight(code) }}
        />
      </pre>
      {showOutput && (
        <div className="border-t bg-background px-3 py-2">
          <div className="text-xs uppercase text-muted-foreground mb-1">Output</div>
          <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}
