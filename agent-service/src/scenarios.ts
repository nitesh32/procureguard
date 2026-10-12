export const users = {
  manager: 'manager@shop.test',
  owner: 'owner@shop.test',
} as const;

export const scenarios = [
  { id: 1, title: 'Restock brake pads', expect: 'allowed', userEmail: users.manager, prompt: 'Brake pads are low, restock them.' },
  { id: 2, title: 'Order engine parts', expect: 'held', userEmail: users.manager, prompt: 'Engine gasket kits are low, order from Konkan.' },
  { id: 3, title: 'Process Apex quote', expect: 'blocked', userEmail: users.manager, prompt: 'Process the latest quote from Apex Components.' },
] as const;

export type Scenario = (typeof scenarios)[number];
