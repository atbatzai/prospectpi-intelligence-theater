/**
 * ProspectPI Intelligence Theater - Test Setup
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Jest test environment setup
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables for tests
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';
process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';
process.env.THEIRSTACK_JWT = 'test-theirstack-jwt';
process.env.MARKETAUX_TOKEN = 'test-marketaux-token';
process.env.CORESIGNAL_MCP_AUTH = 'test-coresignal-auth';

// Set test timeouts
jest.setTimeout(30000);