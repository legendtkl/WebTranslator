import { BaseProvider } from './base-provider.js';

/**
 * Qwen (千问) LLM Provider - Alibaba's LLM service
 * API is OpenAI-compatible
 */
export class QwenProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'qwen';
    this.displayName = 'Qwen (千问)';
    this.endpoint = config.endpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.apiKey = config.apiKey;
    this.model = config.model || 'qwen-turbo';
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.3;
    this.customHeaders = config.customHeaders || {};
  }

  getName() {
    return this.name;
  }

  getDisplayName() {
    return this.displayName;
  }

  getMaxBatchSize() {
    return 6; // Qwen batch size
  }

  async translateBatch(texts, sourceLang, targetLang) {
    const prompt = this.formatPrompt(texts, sourceLang, targetLang);
    
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: false
    };

    // Build Qwen API URL
    const cleanEndpoint = this.endpoint.replace(/\/$/, '');
    const url = `${cleanEndpoint}/chat/completions`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...this.customHeaders
    };

    // Debug logging - mask API key for security
    const debugHeaders = {};
    Object.keys(headers).forEach(key => {
      debugHeaders[key] = key.toLowerCase().includes('auth') || key.toLowerCase().includes('key') 
        ? '***masked***' 
        : headers[key];
    });


    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Qwen API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Qwen API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Qwen API');
      }

      const translatedText = data.choices[0].message.content;
      const translations = this.parseResponse(translatedText, texts.length);
      
      return {
        translations,
        provider: this.name
      };
    } catch (error) {
      console.error('Qwen translation error:', error);
      throw error;
    }
  }

  validateConfig() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('API Key is required for Qwen');
    }
    
    if (!this.endpoint) {
      errors.push('Endpoint URL is required for Qwen');
    }
    
    if (!this.model) {
      errors.push('Model is required for Qwen');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getConfigSchema() {
    return {
      name: this.name,
      displayName: this.displayName,
      fields: [
        {
          key: 'endpoint',
          label: 'Endpoint URL',
          type: 'url',
          required: true,
          default: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          description: 'Qwen API endpoint URL (OpenAI compatible mode)'
        },
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'Enter your Qwen API key',
          description: 'Your Qwen API key from Alibaba Cloud'
        },
        {
          key: 'model',
          label: 'Model',
          type: 'select',
          required: true,
          default: 'qwen-turbo',
          options: [
            { value: 'qwen-turbo', label: 'Qwen Turbo (Fast)' },
            { value: 'qwen-plus', label: 'Qwen Plus (Balanced)' },
            { value: 'qwen-max', label: 'Qwen Max (Best Quality)' },
            { value: 'qwen-max-longcontext', label: 'Qwen Max Long Context' }
          ],
          description: 'Qwen model to use for translation'
        },
        {
          key: 'maxTokens',
          label: 'Max Tokens',
          type: 'number',
          required: false,
          default: 4000,
          min: 100,
          max: 8000,
          description: 'Maximum tokens for response'
        },
        {
          key: 'temperature',
          label: 'Temperature',
          type: 'number',
          required: false,
          default: 0.3,
          min: 0,
          max: 1,
          step: 0.1,
          description: 'Translation creativity (0=deterministic, 1=creative)'
        },
        {
          key: 'customHeaders',
          label: 'Custom Headers (JSON)',
          type: 'textarea',
          required: false,
          placeholder: '{}',
          description: 'Additional HTTP headers in JSON format'
        }
      ]
    };
  }
}