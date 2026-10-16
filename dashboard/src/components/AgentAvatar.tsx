import { Bot } from 'lucide-react';

// The purchasing agent's identity in the chat: a solid neutral circle, with a pulse dot while it works.
export function AgentAvatar({ working = false, size = 'md' }: { working?: boolean; size?: 'md' | 'lg' }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full bg-panel-2 text-ink ${size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'}`}>
      <Bot className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} aria-hidden />
      {working && <span aria-hidden className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 animate-pulse-dot rounded-full border-2 border-panel bg-ink" />}
    </span>
  );
}
