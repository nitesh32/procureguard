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

type Line = { role: 'user' | 'agent'; text: string };

function VoiceCall({ agentId, runId, requestedBy, amount, quoteId, reason }: VoiceApprovalProps) {
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
          reason: reason === 'rule_action_hold' || !reason ? 'every purchase order needs owner approval' : reason,
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
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void callOwner()}
          className="inline-flex items-center gap-2 rounded-full border border-held/40 bg-panel px-4 py-1.5 text-sm font-medium text-held shadow-sm hover:bg-held/5"
        >
          <Mic className="h-4 w-4" aria-hidden /> Ask the owner by voice
        </button>
        {line && <span className="text-xs text-muted">Last call: “{line.text}”</span>}
        {error && <span className="text-xs text-blocked">{error} · use the ArmorIQ console instead.</span>}
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-4 rounded-2xl border border-line bg-panel px-4 py-3 shadow-sm">
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
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blocked text-white shadow-sm hover:bg-blocked/90"
      >
        <PhoneOff className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

// An orb that breathes with the live audio level: violet while the assistant
// speaks, green while the owner speaks. Driven by requestAnimationFrame, not
// React state, so it stays smooth.
function VoiceOrb({ active, speaker, level }: { active: boolean; speaker: 'agent' | 'user'; level: () => number }) {
  const orb = useRef<HTMLSpanElement>(null);
  const halo = useRef<HTMLSpanElement>(null);
  const read = useRef(level);
  read.current = level;

  useEffect(() => {
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let smooth = 0;
    const tick = () => {
      smooth += (Math.min(1, read.current() * 2.2) - smooth) * 0.25;
      if (orb.current) orb.current.style.transform = `scale(${1 + smooth * 0.35})`;
      if (halo.current) {
        halo.current.style.transform = `scale(${1.15 + smooth * 0.9})`;
        halo.current.style.opacity = String(0.15 + smooth * 0.45);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const colours = speaker === 'agent' ? 'from-indigo-500 to-violet-600' : 'from-emerald-400 to-green-600';
  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center" aria-hidden>
      <span ref={halo} className={`absolute inset-0 rounded-full bg-linear-to-br opacity-20 blur-md ${colours}`} />
      <span
        ref={orb}
        className={`relative h-10 w-10 rounded-full bg-linear-to-br shadow-lg transition-colors duration-300 ${colours} ${active ? '' : 'animate-pulse-dot'}`}
      />
    </span>
  );
}
