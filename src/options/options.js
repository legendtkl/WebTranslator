import { initializeI18n, getMessage, getProviderName } from '../utils/i18n.js';

// Provider schemas - these would ideally come from the provider classes
const PROVIDER_SCHEMAS = {
  'azure-openai': {
    name: 'azure-openai',
    displayName: () => getProviderName('azure-openai'),
    fields: [
      {
        key: 'endpoint',
        label: () => getMessage('endpointUrl'),
        type: 'url',
        required: true,
        placeholder: 'https://your-resource.openai.azure.com',
        description: 'Your Azure OpenAI endpoint URL'
      },
      {
        key: 'apiVersion',
        label: () => getMessage('apiVersion'),
        type: 'text',
        required: true,
        default: '2024-03-01-preview',
        description: 'Azure OpenAI API version'
      },
      {
        key: 'apiKey',
        label: () => getMessage('apiKey'),
        type: 'password',
        required: true,
        placeholder: 'sk-...',
        description: 'Your Azure OpenAI API key'
      },
      {
        key: 'model',
        label: () => getMessage('model'),
        type: 'text',
        required: true,
        default: 'gpt-4',
        placeholder: 'gpt-4',
        description: 'Azure OpenAI model name'
      },
      {
        key: 'maxTokens',
        label: () => getMessage('maxTokens'),
        type: 'number',
        required: false,
        default: 1000,
        min: 100,
        max: 4000,
        description: 'Maximum tokens for response'
      },
      {
        key: 'customHeaders',
        label: () => getMessage('customHeaders'),
        type: 'textarea',
        required: false,
        placeholder: '{"X-TT-LOGID": ""}',
        description: 'Additional HTTP headers in JSON format'
      }
    ]
  },
  'doubao': {
    name: 'doubao',
    displayName: () => getProviderName('doubao'),
    fields: [
      {
        key: 'endpoint',
        label: () => getMessage('endpointUrl'),
        type: 'url',
        required: true,
        default: 'https://ark.cn-beijing.volces.com/api/v3',
        placeholder: 'https://ark.cn-beijing.volces.com/api/v3',
        description: 'Doubao API endpoint URL'
      },
      {
        key: 'apiKey',
        label: () => getMessage('apiKey'),
        type: 'password',
        required: true,
        placeholder: 'Enter your Doubao API key',
        description: 'Your Doubao API key from ByteDance'
      },
      {
        key: 'model',
        label: () => getMessage('model'),
        type: 'text',
        required: true,
        default: 'ep-20241216084100-xnqf8',
        placeholder: 'ep-20241216084100-xnqf8',
        description: 'Doubao model endpoint ID'
      },
      {
        key: 'maxTokens',
        label: () => getMessage('maxTokens'),
        type: 'number',
        required: false,
        default: 4000,
        min: 100,
        max: 8000,
        description: 'Maximum tokens for response'
      },
      {
        key: 'temperature',
        label: () => getMessage('temperature'),
        type: 'number',
        required: false,
        default: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
        description: 'Translation creativity (0=deterministic, 1=creative)'
      }
    ]
  },
  'qwen': {
    name: 'qwen',
    displayName: 'Qwen (千问)',
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
        type: 'text',
        required: true,
        default: 'qwen-turbo',
        placeholder: 'qwen-turbo, qwen-plus, qwen-max, qwen-max-longcontext',
        description: 'Qwen model to use for translation (e.g., qwen-turbo)'
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
      }
    ]
  },
  'kimi': {
    name: 'kimi',
    displayName: 'Kimi (Moonshot AI)',
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
        type: 'text',
        required: true,
        default: 'moonshot-v1-8k',
        placeholder: 'moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k',
        description: 'Kimi model to use for translation (e.g., moonshot-v1-8k)'
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
      }
    ]
  },
  'glm': {
    name: 'glm',
    displayName: 'GLM (智谱AI)',
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
        type: 'text',
        required: true,
        default: 'glm-4',
        placeholder: 'glm-4, glm-4v, glm-3-turbo',
        description: 'GLM model to use for translation (e.g., glm-4)'
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
      }
    ]
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize internationalization
  initializeI18n();
  
  // DOM elements
  const providerSelect = document.getElementById('provider-select');
  const configsContainer = document.getElementById('provider-configs-container');
  const saveBtn = document.getElementById('save-settings');
  const testBtn = document.getElementById('test-connection');
  const statusDiv = document.getElementById('status');
  
  // General settings
  const defaultSource = document.getElementById('default-source');
  const defaultTarget = document.getElementById('default-target');

  let currentConfig = {};

  // Initialize
  generateProviderConfigs();
  await loadSettings();
  
  // Ensure the default provider config is shown (safety check)
  setTimeout(() => {
    if (!document.querySelector('.provider-config[style*="block"]')) {
      onProviderChange();
    }
  }, 100);
  
  // Event listeners
  providerSelect.addEventListener('change', onProviderChange);
  saveBtn.addEventListener('click', saveSettings);
  testBtn.addEventListener('click', testConnection);

  function generateProviderConfigs() {
    configsContainer.innerHTML = '';
    
    Object.values(PROVIDER_SCHEMAS).forEach(schema => {
      const configDiv = document.createElement('div');
      configDiv.id = `${schema.name}-config`;
      configDiv.className = 'provider-config';
      configDiv.style.display = 'none';
      
      const title = document.createElement('h3');
      const displayName = typeof schema.displayName === 'function' ? schema.displayName() : schema.displayName;
      title.textContent = `${displayName} Configuration`;
      configDiv.appendChild(title);
      
      schema.fields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.setAttribute('for', `${schema.name}-${field.key}`);
        const labelText = typeof field.label === 'function' ? field.label() : field.label;
        label.textContent = labelText + (field.required ? ' ' + getMessage('required') : '') + ':';
        formGroup.appendChild(label);
        
        let input;
        
        if (field.type === 'textarea') {
          input = document.createElement('textarea');
          input.rows = 3;
        } else {
          input = document.createElement('input');
          input.type = field.type || 'text';
        }
        
        input.id = `${schema.name}-${field.key}`;
        input.name = field.key;
        
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.min !== undefined) input.min = field.min;
        if (field.max !== undefined) input.max = field.max;
        if (field.step !== undefined) input.step = field.step;
        if (field.default !== undefined) input.value = field.default;
        
        formGroup.appendChild(input);
        
        if (field.description) {
          const desc = document.createElement('small');
          desc.className = 'field-description';
          desc.textContent = field.description;
          formGroup.appendChild(desc);
        }
        
        configDiv.appendChild(formGroup);
      });
      
      configsContainer.appendChild(configDiv);
    });
  }

  function onProviderChange() {
    // Hide all provider configs
    const allConfigs = configsContainer.querySelectorAll('.provider-config');
    allConfigs.forEach(config => config.style.display = 'none');
    
    // Show selected provider config
    const selectedProvider = providerSelect.value;
    const selectedConfig = document.getElementById(`${selectedProvider}-config`);
    if (selectedConfig) {
      selectedConfig.style.display = 'block';
    }
  }

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings', 'providers']);
      const settings = result.settings || {};
      const providers = result.providers || {};
      
      currentConfig = { settings, providers };
      
      // Set active provider (default to azure-openai if not set)
      providerSelect.value = settings.activeProvider || 'azure-openai';
      
      // Set general settings
      if (settings.defaultSourceLang) {
        defaultSource.value = settings.defaultSourceLang;
      }
      if (settings.defaultTargetLang) {
        defaultTarget.value = settings.defaultTargetLang;
      }
      
      // Load provider configurations
      Object.keys(PROVIDER_SCHEMAS).forEach(providerName => {
        const providerConfig = providers[providerName] || {};
        const schema = PROVIDER_SCHEMAS[providerName];
        
        schema.fields.forEach(field => {
          const input = document.getElementById(`${providerName}-${field.key}`);
          if (input && providerConfig[field.key] !== undefined) {
            input.value = providerConfig[field.key];
          }
        });
      });
      
      // Show current provider config
      onProviderChange();
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      showStatus('Failed to load settings', 'error');
    }
  }

  async function saveSettings() {
    try {
      showStatus(getMessage('savingSettings'), 'info');
      
      const settings = {
        activeProvider: providerSelect.value,
        defaultSourceLang: defaultSource.value,
        defaultTargetLang: defaultTarget.value
      };
      
      const providers = {};
      
      // Collect all provider configurations
      Object.keys(PROVIDER_SCHEMAS).forEach(providerName => {
        const schema = PROVIDER_SCHEMAS[providerName];
        const providerConfig = { enabled: providerName === settings.activeProvider };
        
        schema.fields.forEach(field => {
          const input = document.getElementById(`${providerName}-${field.key}`);
          if (input) {
            let value = input.value.trim();
            
            // Handle JSON fields
            if (field.key === 'customHeaders' && value) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                throw new Error(`Invalid JSON in ${schema.displayName} Custom Headers field`);
              }
            }
            
            // Handle numeric fields
            if (field.type === 'number' && value) {
              value = parseFloat(value);
            }
            
            if (value !== '' && value !== undefined) {
              providerConfig[field.key] = value;
            }
          }
        });
        
        providers[providerName] = providerConfig;
      });
      
      // Validate active provider configuration
      const activeProvider = providers[settings.activeProvider];
      const activeSchema = PROVIDER_SCHEMAS[settings.activeProvider];
      
      const requiredFields = activeSchema.fields.filter(field => field.required);
      for (const field of requiredFields) {
        if (!activeProvider[field.key]) {
          throw new Error(`${field.label} is required for ${activeSchema.displayName}`);
        }
      }
      
      // Save to storage
      await chrome.storage.sync.set({ settings, providers });
      
      showStatus(getMessage('settingsSaved'), 'success');
      
      // Notify background script to reinitialize
      try {
        await chrome.runtime.sendMessage({ action: 'reinitializeProvider' });
      } catch (error) {
        console.log('Background script not ready, will initialize on next startup');
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      showStatus(error.message || 'Failed to save settings', 'error');
    }
  }

  async function testConnection() {
    try {
      showStatus(getMessage('testingConnection'), 'info');
      
      const response = await chrome.runtime.sendMessage({
        action: 'testConnection'
      });
      
      if (response && response.success) {
        showStatus(getMessage('connectionTestSuccessful'), 'success');
      } else {
        showStatus(response?.error || getMessage('connectionTestFailed'), 'error');
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
      showStatus(error.message || getMessage('connectionTestFailed'), 'error');
    }
  }

  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
});