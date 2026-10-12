// All network calls the dashboard makes. Everything goes to the agent-service /api.

export type RunEvent = { type: string; at: string } & { [field: string]: any };
export type Scenario = { id: number; title: string; expect: string; prompt: string };
export type DashboardConfig = {
  armoriqConsoleUrl: string;
  users: Record<string, string>;
  elevenLabsAgentId: string | null;
};
export type ShopState = {
  inventory: { sku: string; name: string; stock: number; reorderLevel: number; unit: string }[];
  orders: { id: string; quoteId: string; supplierId: string; sku: string; qty: number; amount: number; createdAt: string }[];
  suppliers: { id: string; name: string; payee?: { bankName: string; accountNumberMasked: string; updatedAt: string } }[];
  reviewFlags: { id: string; entityId: string; reason: string }[];
};
export type RunRequest = { prompt: string; userEmail: string; armoriqEnabled: boolean };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
}

const postJson = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  config: () => request<DashboardConfig>('/config'),
  scenarios: () => request<Scenario[]>('/scenarios'),
  shopState: () => request<ShopState>('/state'),
  resetShop: () => request<ShopState>('/reset', { method: 'POST' }),
  startRun: (run: RunRequest) => request<{ runId: string }>('/runs', postJson(run)),
  recordApproval: (runId: string, decision: 'approve' | 'reject') =>
    request<{ recorded: boolean; consoleUrl: string }>(`/approvals/${runId}`, postJson({ decision })),
  runEvents: (runId: string) => new EventSource(`/api/runs/${runId}/events`),
};
