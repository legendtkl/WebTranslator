/**
 * Base class for all LLM providers
 */
export class BaseProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Translate an array of texts
   * @param {string[]} texts - Array of texts to translate
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<string[]>} - Array of translated texts
   */
  async translate(_texts, _sourceLang, _targetLang) {
    throw new Error('translate method must be implemented');
  }

  /**
   * Validate the provider configuration
   * @returns {Promise<boolean>}
   */
  async validateConfig() {
    throw new Error('validateConfig method must be implemented');
  }

  /**
   * Get the maximum batch size for this provider
   * @returns {number}
   */
  getMaxBatchSize() {
    return 10; // Default batch size
  }

  /**
   * Get the provider name
   * @returns {string}
   */
  getName() {
    return 'base';
  }

  /**
   * Format the translation prompt
   * @param {string[]} texts - Texts to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {string}
   */
  formatPrompt(texts, sourceLang, targetLang) {
    const textList = texts.map((text, i) => `${i + 1}. ${text}`).join('\n');
    
    // Get target language name for better prompt clarity
    const targetLangName = this.getLanguageName(targetLang);
    
    return `You are a professional web content translator. Translate the following texts from ${sourceLang} to ${targetLang}.

Translation guidelines:
- Write like a native ${targetLangName} speaker would naturally express these ideas
- Use shorter, clearer sentences when possible without changing the meaning
- Maintain the original tone and formality level
- Keep technical terms accurate but accessible
- Ensure the translation flows naturally and reads smoothly
- Preserve any formatting or special characters

Return only the translations, numbered exactly as shown:

${textList}`;
  }

  /**
   * Get readable language name
   * @param {string} langCode - Language code (e.g., 'zh', 'en')
   * @returns {string}
   */
  getLanguageName(langCode) {
    const langNames = {
      'zh': 'Chinese',
      'en': 'English',
      'ja': 'Japanese',
      'ko': 'Korean',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
      'auto': 'the target language'
    };
    
    return langNames[langCode] || langCode;
  }

  /**
   * Parse response from LLM into array of translations
   * @param {string} response - Raw response from LLM
   * @param {number} expectedCount - Expected number of translations
   * @returns {string[]}
   */
  parseResponse(response, expectedCount) {
    const lines = response.trim().split('\n');
    const translations = [];
    
    for (let i = 0; i < expectedCount; i++) {
      const line = lines[i] || '';
      // Remove numbering if present (1. 2. etc.)
      const cleaned = line.replace(/^\d+\.\s*/, '').trim();
      translations.push(cleaned || `[Translation ${i + 1} failed]`);
    }
    
    return translations;
  }
}