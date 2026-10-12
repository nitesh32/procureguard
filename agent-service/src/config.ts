import { z } from 'zod';

const configSchema = z.object({
  AGENT_PORT: z.coerce.number().int().default(8787),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ARMORIQ_API_KEY: z.string().min(1),
  ARMORIQ_AGENT_NAME: z.string().min(1),
  ARMORIQ_MCP_NAME: z.string().min(1),
  ARMORIQ_APPROVAL_WAIT_SECONDS: z.coerce.number().int().positive().default(60),
  MCP_URL: z.string().url(),
  RESET_SECRET: z.string().min(1),
  LLM_BASE_URL: z.string().url(),
  LLM_API_KEY: z.string().min(1),
  LLM_MODEL_DEV: z.string().min(1),
  LLM_MODEL_DEMO: z.string().min(1),
  LLM_PROFILE: z.enum(['dev', 'demo']).default('dev'),
  // Optional: an empty value means voice approval is off.
  ELEVENLABS_AGENT_ID: z.string().optional().transform((value) => value || undefined),
});

export type Config = z.infer<typeof configSchema> & { llmModel: string };

/** Parse env once at startup; throws listing every missing or invalid variable. */
export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid configuration (see .env.example):\n  ${problems.join('\n  ')}`);
  }
  const config = parsed.data;
  return { ...config, llmModel: config.LLM_PROFILE === 'demo' ? config.LLM_MODEL_DEMO : config.LLM_MODEL_DEV };
}
