import type { Verdict } from '../feed';

// Colour is never the only signal: every verdict has an icon and a word.
export const verdictLook: Record<Verdict, { icon: string; label: string; text: string; bg: string }> = {
  checking: { icon: '◌', label: 'checking', text: 'text-checking', bg: 'bg-checking/15' },
  allowed: { icon: '✓', label: 'allowed', text: 'text-allowed', bg: 'bg-allowed/15' },
  approved: { icon: '✓', label: 'approved', text: 'text-allowed', bg: 'bg-allowed/15' },
  held: { icon: '⏸', label: 'held', text: 'text-held', bg: 'bg-held/15' },
  blocked: { icon: '⛔', label: 'blocked', text: 'text-blocked', bg: 'bg-blocked/15' },
  rejected: { icon: '✕', label: 'not approved', text: 'text-blocked', bg: 'bg-blocked/10' },
  failed: { icon: '!', label: 'tool error', text: 'text-muted', bg: 'bg-muted/15' },
  'no-verdict': { icon: '–', label: 'no verdict received', text: 'text-muted', bg: 'bg-muted/10' },
};

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const look = verdictLook[verdict];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${look.text} ${look.bg}`}>
      <span aria-hidden>{look.icon}</span>
      {look.label}
    </span>
  );
}
