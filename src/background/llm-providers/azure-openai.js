import { BaseProvider } from './base-provider.js';

/**
 * Azure OpenAI provider implementation
 */
export class AzureOpenAIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion || '2024-03-01-preview';
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4';
    this.maxTokens = config.maxTokens || 1000;
    this.customHeaders = config.customHeaders || {};
  }

  getName() {
    return 'azure-openai';
  }

  async validateConfig() {
    return !!(this.endpoint && this.apiKey && this.model);
  }

  async translate(texts, sourceLang = 'auto', targetLang = 'zh') {
    if (!await this.validateConfig()) {
      throw new Error('Azure OpenAI configuration is invalid');
    }

    const batches = this.createBatches(texts);
    const results = [];

    for (const batch of batches) {
      const batchResult = await this.translateBatch(batch, sourceLang, targetLang);
      results.push(...batchResult);
    }

    return results;
  }

  createBatches(texts) {
    const batchSize = this.getMaxBatchSize();
    const batches = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }
    
    return batches;
  }

  async translateBatch(texts, sourceLang, targetLang) {
    const prompt = this.formatPrompt(texts, sourceLang, targetLang);
    
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ],
      max_tokens: this.maxTokens,
      temperature: 0.3
    };

    // Build proper Azure OpenAI URL
    // Remove trailing slash from endpoint if present
    const cleanEndpoint = this.endpoint.replace(/\/$/, '');
    
    // Check if it's Azure OpenAI format or custom format
    let url;
    if (cleanEndpoint.includes('openai.azure.com')) {
      // Standard Azure OpenAI format
      url = `${cleanEndpoint}/openai/deployments/${this.model}/chat/completions?api-version=${this.apiVersion}`;
    } else {
      // Custom endpoint format (like the one you're using)
      url = `${cleanEndpoint}/chat/completions?api-version=${this.apiVersion}`;
    }

    const headers = {
      'Content-Type': 'application/json',
      'api-key': this.apiKey,  // Try api-key header instead of Authorization
      ...this.customHeaders
    };

    // Also try with Authorization header as fallback
    if (!this.customHeaders['api-key']) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Debug logging - mask API key for security
    const debugHeaders = {};
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('auth')) {
        debugHeaders[key] = headers[key] ? headers[key].substring(0, 8) + '...' : 'NOT_SET';
      } else {
        debugHeaders[key] = headers[key];
      }
    });


    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const content = data.choices?.[0]?.message?.content || '';
      
      return this.parseResponse(content, texts.length);
    } catch (error) {
      console.error('Azure OpenAI translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  getMaxBatchSize() {
    return 5; // Conservative batch size for Azure OpenAI
  }
}