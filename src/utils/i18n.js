/**
 * Internationalization utility for WebTranslator extension
 * Uses Chrome's built-in i18n API
 */

/**
 * Get localized message by key
 * @param {string} key - Message key
 * @param {string|Array} substitutions - Optional substitutions
 * @returns {string} Localized message
 */
export function getMessage(key, substitutions = null) {
  try {
    return chrome.i18n.getMessage(key, substitutions) || key;
  } catch (error) {
    console.warn('i18n: Failed to get message for key:', key, error);
    return key;
  }
}

/**
 * Get current UI language
 * @returns {string} Language code (e.g., 'en', 'zh_CN')
 */
export function getCurrentLanguage() {
  return chrome.i18n.getUILanguage();
}

/**
 * Localize all elements with data-i18n attribute
 * @param {Document|Element} root - Root element to search (defaults to document)
 */
export function localizeDocument(root = document) {
  const elements = root.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = getMessage(key);
    
    if (message !== key) {
      // Check if we should set text content or a specific attribute
      const attr = element.getAttribute('data-i18n-attr');
      if (attr) {
        element.setAttribute(attr, message);
      } else {
        element.textContent = message;
      }
    }
  });
}

/**
 * Localize elements with data-i18n-placeholder attribute
 * @param {Document|Element} root - Root element to search (defaults to document)
 */
export function localizePlaceholders(root = document) {
  const elements = root.querySelectorAll('[data-i18n-placeholder]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const message = getMessage(key);
    
    if (message !== key) {
      element.placeholder = message;
    }
  });
}

/**
 * Localize elements with data-i18n-title attribute  
 * @param {Document|Element} root - Root element to search (defaults to document)
 */
export function localizeTitles(root = document) {
  const elements = root.querySelectorAll('[data-i18n-title]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const message = getMessage(key);
    
    if (message !== key) {
      element.title = message;
    }
  });
}

/**
 * Comprehensive localization of the current document
 * Call this after DOM is loaded
 */
export function initializeI18n() {
  localizeDocument();
  localizePlaceholders();
  localizeTitles();
}

/**
 * Format a message with parameters
 * @param {string} key - Message key
 * @param {...string} params - Parameters to substitute
 * @returns {string} Formatted message
 */
export function formatMessage(key, ...params) {
  return getMessage(key, params);
}

/**
 * Get localized provider name
 * @param {string} providerId - Provider ID (e.g., 'azure-openai', 'doubao')
 * @returns {string} Localized provider name
 */
export function getProviderName(providerId) {
  const keyMap = {
    'azure-openai': 'providerAzureOpenAI',
    'doubao': 'providerDoubao', 
    'qwen': 'providerQwen',
    'kimi': 'providerKimi',
    'glm': 'providerGLM'
  };
  
  const key = keyMap[providerId];
  return key ? getMessage(key) : providerId;
}

/**
 * Get localized language name
 * @param {string} langCode - Language code (e.g., 'en', 'zh', 'es')
 * @returns {string} Localized language name
 */
export function getLanguageName(langCode) {
  const keyMap = {
    'zh': 'chinese',
    'en': 'english',
    'es': 'spanish',
    'fr': 'french',
    'de': 'german',
    'ja': 'japanese',
    'ko': 'korean'
  };
  
  const key = keyMap[langCode];
  return key ? getMessage(key) : langCode;
}