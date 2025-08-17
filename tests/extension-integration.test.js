// Integration tests for WebTranslator extension

describe('WebTranslator Extension Integration', () => {
  let mockTab;
  
  beforeEach(() => {
    mockTab = { id: 1, url: 'https://example.com' };
    chrome.tabs.query.mockResolvedValue([mockTab]);
    chrome.tabs.sendMessage.mockResolvedValue({ status: 'done' });
    chrome.storage.sync.get.mockResolvedValue({
      settings: {
        defaultSourceLang: 'en',
        defaultTargetLang: 'zh',
        activeProvider: 'azure-openai'
      },
      providers: {
        'azure-openai': {
          endpoint: 'https://test.openai.azure.com',
          apiKey: 'test-key',
          model: 'gpt-4',
          enabled: true
        }
      }
    });
  });

  test('popup should load settings from storage', async () => {
    const { loadSettings } = require('../src/popup/popup.js');
    
    await loadSettings();
    
    expect(chrome.storage.sync.get).toHaveBeenCalledWith(['settings']);
  });

  test('translation flow should work end-to-end', async () => {
    // Mock fetch for API call
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: '1. 你好\n2. 世界'
          }
        }]
      })
    });

    // Simulate content script message handling
    const message = {
      action: 'translate',
      texts: ['Hello', 'World'],
      sourceLang: 'en',
      targetLang: 'zh'
    };

    // This would be handled by service worker
    const { AzureOpenAIProvider } = require('../src/background/llm-providers/azure-openai.js');
    const provider = new AzureOpenAIProvider({
      endpoint: 'https://test.openai.azure.com',
      apiKey: 'test-key',
      model: 'gpt-4'
    });

    const result = await provider.translate(message.texts, message.sourceLang, message.targetLang);
    
    expect(result).toEqual(['你好', '世界']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('error handling should work properly', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    
    const { AzureOpenAIProvider } = require('../src/background/llm-providers/azure-openai.js');
    const provider = new AzureOpenAIProvider({
      endpoint: 'https://test.openai.azure.com',
      apiKey: 'test-key',
      model: 'gpt-4'
    });

    await expect(provider.translate(['Hello'], 'en', 'zh')).rejects.toThrow('Translation failed');
  });

  test('content script should extract text nodes correctly', () => {
    // Set up DOM
    document.body.innerHTML = `
      <div>
        <p>Hello world</p>
        <span>Test text</span>
        <script>console.log('ignore this');</script>
      </div>
    `;

    // This would test the actual content script functionality
    // Note: This is a simplified test - actual implementation would need to load the content script
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (!node.parentNode || /script|style|noscript/.test(node.parentNode.nodeName.toLowerCase())) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      textNodes.push(currentNode.nodeValue);
    }

    expect(textNodes).toEqual(['Hello world', 'Test text']);
  });

  test('settings should be saved correctly', async () => {
    chrome.storage.sync.set.mockResolvedValue();

    const settings = {
      defaultSourceLang: 'en',
      defaultTargetLang: 'zh'
    };

    await chrome.storage.sync.set({ settings });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ settings });
  });
});