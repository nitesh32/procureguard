// ArmorIQ's official mark (from armoriq.ai), inlined so it renders offline and can be sized freely.
export const armoriqOrange = '#D97D55';

export function ArmorIQMark({ className = 'h-4 w-4', colour = armoriqOrange }: { className?: string; colour?: string }) {
  return (
    <svg viewBox="0 0 27 27" fill="none" className={className} role="img" aria-label="ArmorIQ">
      <path d="M6.24707 16.1818L9.14204 11.9663L11.8338 15.8771L14.5257 11.9663L17.1667 15.8771L20.0617 11.7124" stroke={colour} strokeWidth="2" strokeLinecap="round" />
      <circle cx="13.1543" cy="13.8457" r="12.1543" stroke={colour} strokeWidth="2" />
    </svg>
  );
}
