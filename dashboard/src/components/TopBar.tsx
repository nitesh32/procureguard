type TopBarProps = {
  users: Record<string, string>;
  userEmail: string;
  onUserChange: (email: string) => void;
  armoriqEnabled: boolean;
  onArmoriqChange: (enabled: boolean) => void;
  onReset: () => void;
  disabled: boolean;
};

export function TopBar({ users, userEmail, onUserChange, armoriqEnabled, onArmoriqChange, onReset, disabled }: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-stone-300 bg-white px-6 py-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Procureguard</h1>
        <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-medium tracking-wider text-amber-800">SANDBOX</span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-stone-500">Acting as</span>
          <select
            id="user"
            className="rounded border border-stone-300 bg-white px-2 py-1"
            value={userEmail}
            onChange={(event) => onUserChange(event.target.value)}
            disabled={disabled}
          >
            {Object.entries(users).map(([role, email]) => (
              <option key={email} value={email}>
                {role} · {email}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onArmoriqChange(!armoriqEnabled)}
          disabled={disabled}
          className={`rounded px-3 py-1 font-medium ${armoriqEnabled ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}
        >
          ArmorIQ {armoriqEnabled ? 'ON' : 'OFF'}
        </button>
        {!armoriqEnabled && (
          <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">ArmorIQ disabled · comparison only</span>
        )}

        <button type="button" onClick={onReset} disabled={disabled} className="rounded border border-stone-300 px-3 py-1 hover:bg-stone-50">
          Reset demo
        </button>
      </div>
    </header>
  );
}
