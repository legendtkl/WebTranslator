import { BaseProvider } from './base-provider.js';

/**
 * Kimi LLM Provider - Moonshot AI's LLM service
 * API is OpenAI-compatible
 */
export class KimiProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'kimi';
    this.displayName = 'Kimi (Moonshot AI)';
    this.endpoint = config.endpoint || 'https://api.moonshot.cn/v1';
    this.apiKey = config.apiKey;
    this.model = config.model || 'moonshot-v1-8k';
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
    return 5; // Kimi batch size
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

    // Build Kimi API URL
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

    console.log('Kimi API Debug Info:', {
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

      console.log('Kimi API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Kimi API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Kimi API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Kimi API Success Response:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoiceContent: data.choices?.[0]?.message?.content?.substring(0, 100) + '...'
      });

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Kimi API');
      }

      const translatedText = data.choices[0].message.content;
      const translations = this.parseResponse(translatedText, texts.length);
      
      return {
        translations,
        provider: this.name
      };
    } catch (error) {
      console.error('Kimi translation error:', error);
      throw error;
    }
  }

  validateConfig() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('API Key is required for Kimi');
    }
    
    if (!this.endpoint) {
      errors.push('Endpoint URL is required for Kimi');
    }
    
    if (!this.model) {
      errors.push('Model is required for Kimi');
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
          default: 'https://api.moonshot.cn/v1',
          placeholder: 'https://api.moonshot.cn/v1',
          description: 'Kimi API endpoint URL'
        },
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'Enter your Kimi API key',
          description: 'Your Kimi API key from Moonshot AI'
        },
        {
          key: 'model',
          label: 'Model',
          type: 'select',
          required: true,
          default: 'moonshot-v1-8k',
          options: [
            { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K' },
            { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K' },
            { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K' }
          ],
          description: 'Kimi model to use for translation'
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