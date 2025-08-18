import { BaseProvider } from './base-provider.js';

/**
 * GLM Provider - Zhipu AI's ChatGLM service
 * API is OpenAI-compatible
 */
export class GLMProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'glm';
    this.displayName = 'GLM (智谱AI)';
    this.endpoint = config.endpoint || 'https://open.bigmodel.cn/api/paas/v4';
    this.apiKey = config.apiKey;
    this.model = config.model || 'glm-4';
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
    return 5; // GLM batch size
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

    // Build GLM API URL
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
        console.error('GLM API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`GLM API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from GLM API');
      }

      const translatedText = data.choices[0].message.content;
      const translations = this.parseResponse(translatedText, texts.length);
      
      return {
        translations,
        provider: this.name
      };
    } catch (error) {
      console.error('GLM translation error:', error);
      throw error;
    }
  }

  validateConfig() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('API Key is required for GLM');
    }
    
    if (!this.endpoint) {
      errors.push('Endpoint URL is required for GLM');
    }
    
    if (!this.model) {
      errors.push('Model is required for GLM');
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
          default: 'https://open.bigmodel.cn/api/paas/v4',
          placeholder: 'https://open.bigmodel.cn/api/paas/v4',
          description: 'GLM API endpoint URL'
        },
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'Enter your GLM API key',
          description: 'Your GLM API key from Zhipu AI'
        },
        {
          key: 'model',
          label: 'Model',
          type: 'select',
          required: true,
          default: 'glm-4',
          options: [
            { value: 'glm-4', label: 'GLM-4 (Latest)' },
            { value: 'glm-4v', label: 'GLM-4V (Vision)' },
            { value: 'glm-3-turbo', label: 'GLM-3 Turbo (Fast)' }
          ],
          description: 'GLM model to use for translation'
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