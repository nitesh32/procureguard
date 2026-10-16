import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Mic, PhoneOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

type VoiceApprovalProps = {
  agentId: string;
  runId: string;
  requestedBy: string;
  amount: number;
  quoteId: string;
  /** Plain-language reason ArmorIQ held the call. */
  why: string;
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

type Line = { role: 'user' | 'agent'; text: string };

function VoiceCall({ agentId, runId, requestedBy, amount, quoteId, why }: VoiceApprovalProps) {
  const [error, setError] = useState<string | null>(null);
  const [line, setLine] = useState<Line | null>(null);
  const conversation = useConversation({
    clientTools: {
      recordDecision: async ({ decision }: Record<string, unknown>) => {
        if (decision !== 'approve' && decision !== 'reject') return 'Decision must be approve or reject.';
        await api.recordApproval(runId, decision);
        return `Recorded: ${decision}. Remind the owner to confirm in the ArmorIQ console.`;
      },
    },
    onMessage: ({ message, role }) => setLine({ role: role === 'user' ? 'user' : 'agent', text: message }),
    onError: (message: unknown) => setError(String(message)),
  });

  const callOwner = async () => {
    setError(null);
    setLine(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({
        agentId,
        connectionType: 'webrtc',
        dynamicVariables: {
          amount: `₹${amount.toLocaleString('en-IN')}`,
          quote_id: quoteId,
          requested_by: requestedBy,
          reason: why,
        },
      });
    } catch (micError) {
      setError(`Microphone unavailable: ${(micError as Error).message}`);
    }
  };

  const status = conversation.status;
  const connected = status === 'connected';
  const inCall = connected || status === 'connecting';
  const speaker = conversation.isSpeaking ? 'agent' : 'user';

  if (!inCall) {
    return (
      <>
        <button
          type="button"
          onClick={() => void callOwner()}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm font-medium transition-colors hover:bg-panel-2"
        >
          <Mic className="h-4 w-4" aria-hidden /> Ask Owner by Voice
        </button>
        {line && <p className="basis-full text-xs text-muted">Last call: “{line.text}”</p>}
        {error && <p className="basis-full text-xs text-blocked">{error}. Approve in the ArmorIQ console instead.</p>}
      </>
    );
  }

  return (
    <div className="flex basis-full items-center gap-4 rounded-lg bg-panel-2 px-4 py-3">
      <VoiceOrb
        active={connected}
        speaker={speaker}
        level={() => (conversation.isSpeaking ? conversation.getOutputVolume() : conversation.getInputVolume())}
      />
      <div className="min-w-0 flex-1" aria-live="polite">
        <p className="text-xs font-medium text-muted">
          {!connected ? 'Calling the owner…' : speaker === 'agent' ? 'Assistant is speaking' : 'Listening to the owner…'}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm">
          {line ? (
            <>
              <span className="font-medium">{line.role === 'agent' ? 'Assistant: ' : 'Owner: '}</span>
              {line.text}
            </>
          ) : (
            <span className="text-muted">Say “yes, approve it” or “no, reject it”.</span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={conversation.endSession}
        aria-label="End call"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blocked text-white transition-colors hover:bg-blocked/90"
      >
        <PhoneOff className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

// A solid circle that scales with the live audio level: ink while the assistant
// speaks, green while the owner speaks. Driven by requestAnimationFrame, not
// React state, so it stays smooth.
function VoiceOrb({ active, speaker, level }: { active: boolean; speaker: 'agent' | 'user'; level: () => number }) {
  const orb = useRef<HTMLSpanElement>(null);
  const read = useRef(level);
  read.current = level;

  useEffect(() => {
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let smooth = 0;
    const tick = () => {
      smooth += (Math.min(1, read.current() * 2.2) - smooth) * 0.25;
      if (orb.current) orb.current.style.transform = `scale(${1 + smooth * 0.35})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center" aria-hidden>
      <span
        ref={orb}
        className={`h-9 w-9 rounded-full transition-colors duration-200 ${speaker === 'agent' ? 'bg-ink' : 'bg-allowed'} ${active ? '' : 'animate-pulse-dot'}`}
      />
    </span>
  );
}
