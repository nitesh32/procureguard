import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

const validEnv = {
  ARMORIQ_API_KEY: 'ak_test_x',
  ARMORIQ_AGENT_NAME: 'procurement-agent',
  ARMORIQ_MCP_NAME: 'procurement-mcp',
  MCP_URL: 'https://example.test/mcp',
  RESET_SECRET: 'secret',
  LLM_BASE_URL: 'https://openrouter.ai/api/v1',
  LLM_API_KEY: 'key',
  LLM_MODEL_DEV: 'cheap-model',
  LLM_MODEL_DEMO: 'strong-model',
};

describe('loadConfig', () => {
  it('fails fast and names every missing variable', () => {
    expect(() => loadConfig({ ...validEnv, ARMORIQ_API_KEY: undefined, LLM_API_KEY: undefined })).toThrow(
      /ARMORIQ_API_KEY[\s\S]*LLM_API_KEY/,
    );
  });

  it('applies defaults and picks the model for the profile', () => {
    expect(loadConfig(validEnv)).toMatchObject({ AGENT_PORT: 8787, ARMORIQ_APPROVAL_WAIT_SECONDS: 60, llmModel: 'cheap-model' });
    expect(loadConfig({ ...validEnv, LLM_PROFILE: 'demo' }).llmModel).toBe('strong-model');
  });
});
