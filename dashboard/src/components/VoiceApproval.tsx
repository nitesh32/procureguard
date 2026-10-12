import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { useState } from 'react';
import { api } from '../api';

type VoiceApprovalProps = {
  agentId: string;
  runId: string;
  requestedBy: string;
  amount: number;
  quoteId: string;
  reason?: string;
};

// The owner hears the request and answers by voice. The ElevenLabs agent calls
// the recordDecision client tool, which only records the answer; the approval
// itself is made in the ArmorIQ console (docs/DECISIONS.md).
export function VoiceApproval(props: VoiceApprovalProps) {
  return (
    <ConversationProvider>
      <VoiceCall {...props} />
    </ConversationProvider>
  );
}

function VoiceCall({ agentId, runId, requestedBy, amount, quoteId, reason }: VoiceApprovalProps) {
  const [error, setError] = useState<string | null>(null);
  const conversation = useConversation({
    clientTools: {
      recordDecision: async ({ decision }: Record<string, unknown>) => {
        if (decision !== 'approve' && decision !== 'reject') return 'Decision must be approve or reject.';
        await api.recordApproval(runId, decision);
        return `Recorded: ${decision}. Remind the owner to confirm in the ArmorIQ console.`;
      },
    },
    onError: (message: unknown) => setError(String(message)),
  });

  const callOwner = async () => {
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({
        agentId,
        connectionType: 'webrtc',
        dynamicVariables: {
          amount: `₹${amount.toLocaleString('en-IN')}`,
          quote_id: quoteId,
          requested_by: requestedBy,
          reason: reason ?? 'above the requester’s order limit',
        },
      });
    } catch (micError) {
      setError(`Microphone unavailable: ${(micError as Error).message}`);
    }
  };

  const inCall = conversation.status === 'connected' || conversation.status === 'connecting';

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      {inCall ? (
        <button type="button" onClick={conversation.endSession} className="rounded bg-red-700 px-3 py-1.5 text-white">
          End call
        </button>
      ) : (
        <button type="button" onClick={() => void callOwner()} className="rounded bg-amber-600 px-3 py-1.5 font-medium text-white">
          🎙 Ask the owner by voice
        </button>
      )}
      <span className="text-xs text-stone-600">
        {conversation.status === 'connected' ? (conversation.isSpeaking ? 'Agent speaking…' : 'Listening…') : conversation.status}
      </span>
      {error && <span className="text-xs text-red-700">{error} · use the console link instead.</span>}
    </div>
  );
}
