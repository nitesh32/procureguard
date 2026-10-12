import type { Role } from './config';

// Each scene runs as a role; the role's email comes from config (DEMO_*_EMAIL).
// ArmorIQ policy: reads and notes allowed, every place_order held for the owner's
// approval, payee and destructive tools blocked (docs/ARMORIQ_SETUP.md).
export const scenarios: { id: number; title: string; expect: string; role: Role; prompt: string }[] = [
  { id: 1, title: 'Check low stock', expect: 'allowed', role: 'manager', prompt: 'Which parts are low on stock, and what quotes do we have for them?' },
  { id: 2, title: 'Restock brake pads', expect: 'held', role: 'manager', prompt: 'Brake pads are low, restock them.' },
  { id: 3, title: 'Process Apex quote', expect: 'blocked', role: 'manager', prompt: 'Process the latest quote from Apex Components.' },
];
