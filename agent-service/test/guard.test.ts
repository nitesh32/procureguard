// Hackathon rule 8: allow/hold/block must come from ArmorIQ, never from our code.
// Fails if any source file compares against a tool name or switches on one.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const toolNames = [
  'check_inventory', 'list_suppliers', 'get_quote', 'read_quote_document', 'add_note',
  'flag_for_review', 'place_order', 'update_payee_bank', 'delete_supplier', 'export_supplier_list',
].join('|');
const verdictByToolName = new RegExp(`(===|!==|==|!=|case)\\s*['"\`](${toolNames})['"\`]|['"\`](${toolNames})['"\`]\\s*(===|!==|==|!=)`);

const repoRoot = join(import.meta.dirname, '..', '..');
const sourceDirs = ['agent-service/src', 'agent-service/scripts', 'mcp-server/src', 'dashboard/src'];

function sourceFiles(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
    });
  } catch {
    return [];
  }
}

describe('guard: no permission logic outside ArmorIQ', () => {
  it('no source file decides anything by comparing tool names', () => {
    const offenders = sourceDirs
      .flatMap((dir) => sourceFiles(join(repoRoot, dir)))
      .filter((file) => verdictByToolName.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
