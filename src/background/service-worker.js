// Background service worker for WebTranslator

import { AzureOpenAIProvider } from './llm-providers/azure-openai.js';
import { DoubaoProvider } from './llm-providers/doubao.js';
import { QwenProvider } from './llm-providers/qwen.js';
import { KimiProvider } from './llm-providers/kimi.js';
import { GLMProvider } from './llm-providers/glm.js';

let currentProvider = null;

// Provider registry
const PROVIDERS = {
  'azure-openai': AzureOpenAIProvider,
  'doubao': DoubaoProvider,
  'qwen': QwenProvider,
  'kimi': KimiProvider,
  'glm': GLMProvider
};

// Initialize the provider when extension starts
chrome.runtime.onStartup.addListener(async () => {
  await initializeProvider();
});

chrome.runtime.onInstalled.addListener(async () => {
  await initializeProvider();
});

async function initializeProvider() {
  try {
    console.log('WebTranslator Service Worker: Initializing provider...');
    const result = await chrome.storage.sync.get(['settings', 'providers']);
    const settings = result.settings || {};
    const providers = result.providers || {};
    
    console.log('WebTranslator Service Worker: Loaded storage data:', {
      settingsKeys: Object.keys(settings),
      providersKeys: Object.keys(providers)
    });
    
    const activeProviderName = settings.activeProvider || 'azure-openai';
    const providerConfig = providers[activeProviderName];
    
    console.log('WebTranslator Service Worker: Provider config:', {
      activeProviderName,
      configExists: !!providerConfig,
      configEnabled: providerConfig?.enabled,
      hasEndpoint: !!providerConfig?.endpoint,
      hasApiKey: !!providerConfig?.apiKey,
      model: providerConfig?.model
    });
    
    if (providerConfig && providerConfig.enabled) {
      const ProviderClass = PROVIDERS[activeProviderName];
      if (ProviderClass) {
        currentProvider = new ProviderClass(providerConfig);
        console.log('WebTranslator Service Worker: Provider initialized successfully');
      } else {
        console.log('WebTranslator Service Worker: Unknown provider:', activeProviderName);
      }
    } else {
      console.log('WebTranslator Service Worker: No valid provider config found');
    }
  } catch (error) {
    console.error('WebTranslator Service Worker: Failed to initialize provider:', error);
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translate') {
    handleTranslation(message, sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'updateProvider') {
    updateProvider(message.config);
    sendResponse({ status: 'updated' });
  }
  
  if (message.action === 'reinitializeProvider') {
    initializeProvider().then(() => {
      sendResponse({ status: 'reinitialized' });
    }).catch(error => {
      sendResponse({ status: 'error', error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'testConnection') {
    testConnection(sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleTranslation(message, sendResponse) {
  console.log('WebTranslator Service Worker: Handling translation request', {
    textsCount: message.texts?.length,
    sourceLang: message.sourceLang,
    targetLang: message.targetLang
  });
  
  try {
    if (!currentProvider) {
      console.log('WebTranslator Service Worker: No provider, initializing...');
      await initializeProvider();
    }
    
    if (!currentProvider) {
      throw new Error('No provider configured. Please configure Azure OpenAI in settings.');
    }
    
    console.log('WebTranslator Service Worker: Using provider:', currentProvider.getName());
    
    const translations = await currentProvider.translate(
      message.texts,
      message.sourceLang,
      message.targetLang
    );
    
    console.log('WebTranslator Service Worker: Translation successful', {
      originalCount: message.texts?.length,
      translationCount: translations?.length
    });
    
    sendResponse({
      status: 'success',
      translations,
      provider: currentProvider.getName()
    });
  } catch (error) {
    console.error('WebTranslator Service Worker: Translation failed:', error);
    sendResponse({
      status: 'error',
      error: error.message
    });
  }
}

async function testConnection(sendResponse) {
  try {
    if (!currentProvider) {
      throw new Error('No provider configured');
    }
    
    console.log('WebTranslator Service Worker: Testing connection...');
    
    // Test with a simple translation
    const testTexts = ['Hello'];
    const result = await currentProvider.translate(testTexts, 'en', 'zh');
    
    if (result && result.translations && result.translations.length > 0) {
      console.log('WebTranslator Service Worker: Connection test successful');
      sendResponse({
        success: true,
        provider: currentProvider.getName(),
        testTranslation: result.translations[0]
      });
    } else {
      throw new Error('Invalid response from provider');
    }
    
  } catch (error) {
    console.error('WebTranslator Service Worker: Connection test failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

function updateProvider(config) {
  const ProviderClass = PROVIDERS[config.provider];
  if (ProviderClass) {
    currentProvider = new ProviderClass(config);
    console.log('WebTranslator Service Worker: Provider updated to', config.provider);
  } else {
    console.error('WebTranslator Service Worker: Unknown provider:', config.provider);
  }
}