import type { Role } from './config';

// Each scene runs as a role; the role's email comes from config (DEMO_*_EMAIL).
// ArmorIQ holds every place_order by the manager for the owner's approval; the owner's are allowed.
export const scenarios: { id: number; title: string; expect: string; role: Role; prompt: string }[] = [
  { id: 1, title: 'Restock brake pads', expect: 'allowed', role: 'owner', prompt: 'Brake pads are low, restock them.' },
  { id: 2, title: 'Order engine parts', expect: 'held', role: 'manager', prompt: 'Engine gasket kits are low, order from Konkan.' },
  { id: 3, title: 'Process Apex quote', expect: 'blocked', role: 'manager', prompt: 'Process the latest quote from Apex Components.' },
];
