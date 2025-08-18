import { BaseProvider } from './base-provider.js';

/**
 * Doubao (豆包) LLM Provider - ByteDance's LLM service
 * API is OpenAI-compatible
 */
export class DoubaoProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'doubao';
    this.displayName = 'Doubao (豆包)';
    this.endpoint = config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
    this.apiKey = config.apiKey;
    this.model = config.model || 'ep-20241216084100-xnqf8';
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
    return 8; // Doubao supports larger batches
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

    // Build Doubao API URL
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

    console.log('Doubao API Debug Info:', {
      url: url,
      headers: debugHeaders,
      model: this.model,
      textCount: texts.length,
      maxTokens: this.maxTokens
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      console.log('Doubao API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Doubao API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Doubao API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Doubao API Success Response:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoiceContent: data.choices?.[0]?.message?.content?.substring(0, 100) + '...'
      });

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Doubao API');
      }

      const translatedText = data.choices[0].message.content;
      const translations = this.parseResponse(translatedText, texts.length);
      
      return {
        translations,
        provider: this.name
      };
    } catch (error) {
      console.error('Doubao translation error:', error);
      throw error;
    }
  }

  validateConfig() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('API Key is required for Doubao');
    }
    
    if (!this.endpoint) {
      errors.push('Endpoint URL is required for Doubao');
    }
    
    if (!this.model) {
      errors.push('Model is required for Doubao');
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
          default: 'https://ark.cn-beijing.volces.com/api/v3',
          placeholder: 'https://ark.cn-beijing.volces.com/api/v3',
          description: 'Doubao API endpoint URL'
        },
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'Enter your Doubao API key',
          description: 'Your Doubao API key from ByteDance'
        },
        {
          key: 'model',
          label: 'Model',
          type: 'text',
          required: true,
          default: 'ep-20241216084100-xnqf8',
          placeholder: 'ep-20241216084100-xnqf8',
          description: 'Doubao model endpoint ID'
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