document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  const providerSelect = document.getElementById('provider-select');
  const saveBtn = document.getElementById('save-settings');
  const testBtn = document.getElementById('test-connection');
  const statusDiv = document.getElementById('status');
  
  // Azure OpenAI fields
  const azureEndpoint = document.getElementById('azure-endpoint');
  const azureApiVersion = document.getElementById('azure-api-version');
  const azureApiKey = document.getElementById('azure-api-key');
  const azureModel = document.getElementById('azure-model');
  const azureMaxTokens = document.getElementById('azure-max-tokens');
  const azureCustomHeaders = document.getElementById('azure-custom-headers');
  
  // General settings
  const defaultSource = document.getElementById('default-source');
  const defaultTarget = document.getElementById('default-target');

  // Load saved settings
  await loadSettings();

  // Event listeners
  saveBtn.addEventListener('click', saveSettings);
  testBtn.addEventListener('click', testConnection);

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings', 'providers']);
      const settings = result.settings || {};
      const providers = result.providers || {};

      // Load general settings
      defaultSource.value = settings.defaultSourceLang || 'auto';
      defaultTarget.value = settings.defaultTargetLang || 'zh';
      providerSelect.value = settings.activeProvider || 'azure-openai';

      // Load Azure OpenAI settings
      const azureConfig = providers['azure-openai'] || {};
      azureEndpoint.value = azureConfig.endpoint || '';
      azureApiVersion.value = azureConfig.apiVersion || '2024-03-01-preview';
      azureApiKey.value = azureConfig.apiKey || '';
      azureModel.value = azureConfig.model || 'gpt-4';
      azureMaxTokens.value = azureConfig.maxTokens || 1000;
      
      if (azureConfig.customHeaders) {
        azureCustomHeaders.value = JSON.stringify(azureConfig.customHeaders, null, 2);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showStatus('Failed to load settings', 'error');
    }
  }

  async function saveSettings() {
    try {
      // Parse custom headers
      let customHeaders = {};
      if (azureCustomHeaders.value.trim()) {
        try {
          customHeaders = JSON.parse(azureCustomHeaders.value);
        } catch (e) {
          throw new Error('Invalid JSON in custom headers');
        }
      }

      // Validate required fields
      if (!azureEndpoint.value || !azureApiKey.value) {
        throw new Error('Endpoint and API key are required');
      }

      const settings = {
        defaultSourceLang: defaultSource.value,
        defaultTargetLang: defaultTarget.value,
        activeProvider: providerSelect.value
      };

      const providers = {
        'azure-openai': {
          endpoint: azureEndpoint.value,
          apiVersion: azureApiVersion.value,
          apiKey: azureApiKey.value,
          model: azureModel.value,
          maxTokens: parseInt(azureMaxTokens.value),
          customHeaders: customHeaders,
          enabled: true
        }
      };

      await chrome.storage.sync.set({ settings, providers });
      
      // Notify background script to update provider
      chrome.runtime.sendMessage({
        action: 'updateProvider',
        config: {
          provider: 'azure-openai',
          ...providers['azure-openai']
        }
      });

      showStatus('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showStatus(error.message || 'Failed to save settings', 'error');
    }
  }

  async function testConnection() {
    try {
      showStatus('Testing connection...', 'info');
      testBtn.disabled = true;

      // Test with a simple translation
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        texts: ['Hello'],
        sourceLang: 'en',
        targetLang: 'zh'
      });

      if (response && response.status === 'success') {
        showStatus('Connection test successful', 'success');
      } else {
        throw new Error(response?.error || 'Test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      showStatus(`Connection test failed: ${error.message}`, 'error');
    } finally {
      testBtn.disabled = false;
    }
  }

  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');
    
    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 3000);
    }
  }
});