import { Ban, Check, CircleAlert, CircleMinus, CirclePause, Loader2, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import type { Verdict } from '../feed';

// Colour is never the only signal: every verdict has an icon and a word.
export const verdictLook: Record<Verdict, { Icon: LucideIcon; label: string; text: string; bg: string; spin?: boolean }> = {
  checking: { Icon: Loader2, label: 'checking', text: 'text-checking', bg: 'bg-panel-2', spin: true },
  allowed: { Icon: Check, label: 'allowed', text: 'text-allowed', bg: 'bg-allowed/10' },
  approved: { Icon: Check, label: 'approved', text: 'text-allowed', bg: 'bg-allowed/10' },
  held: { Icon: CirclePause, label: 'held', text: 'text-held', bg: 'bg-held/10' },
  blocked: { Icon: Ban, label: 'blocked', text: 'text-blocked', bg: 'bg-blocked/10' },
  error: { Icon: CircleAlert, label: 'check failed', text: 'text-blocked', bg: 'bg-panel-2' },
  rejected: { Icon: X, label: 'not approved', text: 'text-blocked', bg: 'bg-blocked/10' },
  failed: { Icon: TriangleAlert, label: 'tool error', text: 'text-muted', bg: 'bg-panel-2' },
  'no-verdict': { Icon: CircleMinus, label: 'no verdict', text: 'text-muted', bg: 'bg-panel-2' },
};

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const { Icon, label, text, bg, spin } = verdictLook[verdict];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${text} ${bg}`}>
      <Icon aria-hidden className={`h-3.5 w-3.5 ${spin ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}
