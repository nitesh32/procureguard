// Usage: pnpm --filter agent-service scenario <1|2|3> [--off] [--as=owner]
// Runs one demo scene headless and prints the decision log. --off runs WITHOUT
// ArmorIQ (comparison only) and leaves the shop modified: run `make reset` after.
import { createLogger } from '@procureguard/shared/log';
import { createArmorIQ, startRun } from '../src/agent';
import { loadConfig } from '../src/config';
import { createRunRegistry, isEndOfRun, type RunEvent } from '../src/runs';
import { scenarios } from '../src/scenarios';

const sceneId = Number(process.argv[2]);
const armoriqEnabled = !process.argv.includes('--off');
const roleOverride = process.argv.find((arg) => arg.startsWith('--as='))?.slice(5);
const scenario = scenarios.find((s) => s.id === sceneId);
if (!scenario) {
  console.error(`Usage: scenario <${scenarios.map((s) => s.id).join('|')}> [--off] [--as=owner]`);
  process.exit(1);
}

const config = loadConfig(process.env);
const log = createLogger('run-scenario', 'warn');
const registry = createRunRegistry(log);
const role = roleOverride === 'owner' ? 'owner' : scenario.role;
const userEmail = config.users[role];

console.log(`\nScene ${scenario.id}: ${scenario.title} (expect: ${scenario.expect})`);
console.log(`User ${role} (${userEmail}) · ArmorIQ ${armoriqEnabled ? 'ON' : 'OFF (comparison only)'} · model ${config.llmModel}\n`);

const runId = startRun({ config, log, registry, armoriq: createArmorIQ(config) }, { prompt: scenario.prompt, userEmail, armoriqEnabled });

registry.subscribe(runId, (event) => {
  console.log(describe(event));
  if (isEndOfRun(event)) process.exit(event.type === 'final' ? 0 : 1);
});

function describe({ type, at, ...fields }: RunEvent): string {
  const time = at.slice(11, 19);
  const detail = Object.entries(fields)
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('  ');
  return `${time}  ${type.toUpperCase().padEnd(16)} ${detail}`;
}
