// Unit tests for Azure OpenAI provider

describe('AzureOpenAIProvider', () => {
  let provider;
  
  beforeEach(() => {
    const config = {
      endpoint: 'https://test.openai.azure.com',
      apiVersion: '2024-03-01-preview',
      apiKey: 'test-key',
      model: 'gpt-4',
      maxTokens: 1000
    };
    
    // Mock import since we can't actually import ES modules in this test env
    const { AzureOpenAIProvider } = require('../src/background/llm-providers/azure-openai.js');
    provider = new AzureOpenAIProvider(config);
  });

  test('getName returns correct provider name', () => {
    expect(provider.getName()).toBe('azure-openai');
  });

  test('validateConfig returns true for valid config', async () => {
    const isValid = await provider.validateConfig();
    expect(isValid).toBe(true);
  });

  test('validateConfig returns false for invalid config', async () => {
    provider.apiKey = '';
    const isValid = await provider.validateConfig();
    expect(isValid).toBe(false);
  });

  test('createBatches splits texts correctly', () => {
    const texts = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const batches = provider.createBatches(texts);
    
    expect(batches.length).toBe(2); // 5 + 2
    expect(batches[0].length).toBe(5);
    expect(batches[1].length).toBe(2);
  });

  test('formatPrompt creates correct prompt structure', () => {
    const texts = ['Hello', 'World'];
    const prompt = provider.formatPrompt(texts, 'en', 'zh');
    
    expect(prompt).toContain('1. Hello');
    expect(prompt).toContain('2. World');
    expect(prompt).toContain('from en to zh');
  });

  test('parseResponse extracts translations correctly', () => {
    const response = '1. 你好\n2. 世界';
    const translations = provider.parseResponse(response, 2);
    
    expect(translations).toEqual(['你好', '世界']);
  });

  test('parseResponse handles missing translations', () => {
    const response = '1. 你好';
    const translations = provider.parseResponse(response, 2);
    
    expect(translations[0]).toBe('你好');
    expect(translations[1]).toContain('Translation 2 failed');
  });
});