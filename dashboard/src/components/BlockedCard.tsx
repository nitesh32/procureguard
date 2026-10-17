import type { ShopState } from '../api';
import { clock, type Call } from '../feed';
import { Card, ConsoleLink, Footer } from './HeldCard';

type BlockedCardProps = {
  call: Call;
  sentence: string;
  /** The payee on file now, already masked by the shop. */
  currentPayee?: NonNullable<ShopState['suppliers'][number]['payee']>;
  consoleUrl: string;
};

// Same mask as the shop's (mcp-server store): last 4 digits only.
const mask = (accountNumber: string) => `••••${accountNumber.slice(-4)}`;

// What ArmorIQ stopped. A bank change shows before/after: payments keep going
// to the verified account and the requested one is never applied.
export function BlockedCard({ call, sentence, currentPayee, consoleUrl }: BlockedCardProps) {
  const { accountNumber, ifsc } = call.args;
  const bankChange = !!accountNumber;

  return (
    <Card alert label="Blocked attempt" border="border-blocked/25" dot="bg-blocked" title={bankChange ? 'Bank change blocked by ArmorIQ' : 'Blocked by ArmorIQ'}>
      {bankChange ? (
        <div className="mt-4 space-y-1.5 text-[17px]">
          <p>
            Payments still go to <span className="font-mono font-medium tabular-nums">{currentPayee?.accountNumberMasked ?? 'the account on file'}</span>
          </p>
          <p>
            Requested <s className="font-mono text-faint tabular-nums">{mask(String(accountNumber))}</s> not applied
          </p>
          {!!ifsc && (
            <p className="pt-1 text-sm text-faint">
              IFSC {currentPayee?.ifsc ?? 'on file'} unchanged · requested {String(ifsc)}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-[15px]">{sentence}. Nothing changed.</p>
      )}
      <Footer>
        <span>
          ArmorIQ reason: {call.reason ?? 'blocked'} · {clock(call.decidedAt ?? call.startedAt)} · nothing reached the shop
        </span>
        <ConsoleLink href={consoleUrl} />
      </Footer>
    </Card>
  );
}
