import { Check, CircleAlert, CircleMinus, Loader2, Pause, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import type { Verdict } from '../feed';

// Colour is never the only signal: every verdict has a glyph and a word.
// The glyph stays grey for the calm cases so only held and blocked catch the eye.
export const verdictLook: Record<Verdict, { Icon: LucideIcon; label: string; text: string; glyph: string; spin?: boolean }> = {
  checking: { Icon: Loader2, label: 'checking', text: 'text-faint', glyph: 'text-faint', spin: true },
  allowed: { Icon: Check, label: 'allowed', text: 'text-allowed', glyph: 'text-faint' },
  approved: { Icon: Check, label: 'approved', text: 'text-allowed', glyph: 'text-faint' },
  held: { Icon: Pause, label: 'held', text: 'text-held', glyph: 'text-held' },
  blocked: { Icon: X, label: 'blocked', text: 'text-blocked', glyph: 'text-blocked' },
  error: { Icon: CircleAlert, label: 'check failed', text: 'text-blocked', glyph: 'text-muted' },
  rejected: { Icon: X, label: 'not approved', text: 'text-muted', glyph: 'text-muted' },
  failed: { Icon: TriangleAlert, label: 'tool error', text: 'text-muted', glyph: 'text-muted' },
  'no-verdict': { Icon: CircleMinus, label: 'no verdict', text: 'text-muted', glyph: 'text-faint' },
};

export function VerdictWord({ verdict }: { verdict: Verdict }) {
  const { label, text } = verdictLook[verdict];
  return <span className={`shrink-0 font-mono text-xs font-medium ${text}`}>{label}</span>;
}

export function VerdictGlyph({ verdict }: { verdict: Verdict }) {
  const { Icon, glyph, spin } = verdictLook[verdict];
  return <Icon aria-hidden strokeWidth={2.25} className={`h-3.5 w-3.5 shrink-0 ${glyph} ${spin ? 'animate-spin' : ''}`} />;
}
