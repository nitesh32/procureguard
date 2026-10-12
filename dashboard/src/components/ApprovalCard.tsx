import type { ReactNode } from 'react';
import type { pendingApproval } from '../feed';

type ApprovalCardProps = {
  approval: NonNullable<ReturnType<typeof pendingApproval>>;
  consoleUrl: string;
  voice?: ReactNode;
};

// ArmorIQ has no approve API: the owner decides (by voice), and the approval
// itself is made in the ArmorIQ console. The held call then resumes on its own.
export function ApprovalCard({ approval, consoleUrl, voice }: ApprovalCardProps) {
  const amount = Number(approval.args.amount);

  return (
    <section className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <p className="text-xs font-semibold tracking-wider text-amber-800 uppercase">Held for owner approval</p>
      <p className="mt-1 text-lg font-semibold">
        {approval.tool} {Number.isFinite(amount) && `· ₹${amount.toLocaleString('en-IN')}`}
      </p>
      <p className="font-mono text-xs text-stone-600">quote {String(approval.args.quoteId ?? '-')}</p>
      {approval.reason && <p className="mt-2 text-sm">{approval.reason}</p>}

      {voice}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {approval.ownerDecision && (
          <span className="rounded bg-white px-2 py-1 font-medium">
            Owner said: {approval.ownerDecision === 'approve' ? 'yes' : 'no'}
          </span>
        )}
        <a href={consoleUrl} target="_blank" rel="noreferrer" className="rounded bg-stone-900 px-3 py-1.5 text-white">
          {approval.ownerDecision === 'reject' ? 'Reject' : 'Approve'} in ArmorIQ console ↗
        </a>
        <span className="text-xs text-stone-600">The order resumes automatically once the console decision lands.</span>
      </div>
    </section>
  );
}
