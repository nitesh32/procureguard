import { Bot } from 'lucide-react';

// The purchasing agent's identity in the chat: gradient avatar with a live status dot.
export function AgentAvatar({ working = false, size = 'md' }: { working?: boolean; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-8 w-8 rounded-xl';
  return (
    <span className={`relative grid shrink-0 place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm ${box}`}>
      <Bot className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} aria-hidden />
      <span
        aria-hidden
        className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel ${working ? 'animate-pulse-dot bg-held' : 'bg-allowed'}`}
      />
    </span>
  );
}
