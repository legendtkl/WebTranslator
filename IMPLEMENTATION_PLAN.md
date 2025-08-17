# WebTranslator Chrome Extension Implementation Plan

## Overview
A Chrome browser extension that translates web pages using various LLM backends. MVP version will support Azure OpenAI, with future support for multiple Chinese and international LLM providers. The extension will support multiple languages and be ready for global distribution via Chrome Web Store.

## Architecture Design

### Core Components

#### 1. Extension Structure
```
WebTranslator/
├── manifest.json           # Chrome extension manifest
├── src/
│   ├── background/        # Service worker scripts
│   │   ├── service-worker.js
│   │   └── llm-providers/  # LLM backend integrations
│   │       ├── base-provider.js      # Base class for all providers
│   │       ├── azure-openai.js       # Azure OpenAI (MVP)
│   │       ├── openai-compatible.js  # Generic OpenAI-compatible
│   │       ├── doubao.js             # 豆包 (ByteDance)
│   │       ├── qwen.js               # 千问 (Alibaba)
│   │       ├── kimi.js               # Kimi (Moonshot AI)
│   │       ├── glm.js                # GLM (Zhipu AI)
│   │       ├── openai.js             # Standard OpenAI
│   │       └── claude.js             # Anthropic Claude
│   ├── content/           # Content scripts
│   │   ├── translator.js  # Main translation logic
│   │   ├── dom-walker.js  # DOM traversal and text extraction
│   │   ├── renderer.js    # Translation rendering
│   │   └── styles.css     # Injected styles
│   ├── popup/             # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/           # Options page
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   └── utils/             # Shared utilities
│       ├── storage.js     # Chrome storage API wrapper
│       ├── i18n.js        # Internationalization
│       ├── crypto.js      # API key encryption
│       └── constants.js
├── _locales/              # Internationalization files
│   ├── en/
│   ├── zh_CN/
│   ├── es/
│   ├── ja/
│   ├── ko/
│   └── ...
├── icons/                 # Extension icons
├── lib/                   # Third-party libraries
└── tests/                 # Test files
```

### LLM Provider Support

#### MVP - Azure OpenAI
```javascript
// Configuration format
{
  provider: 'azure-openai',
  config: {
    endpoint: 'https://xx/gpt_openapi',
    apiVersion: '2024-03-01-preview',
    apiKey: 'sk-xxx',
    model: 'gpt-5-chat-2025-08-07',
    maxTokens: 1000,
    customHeaders: {
      'X-TT-LOGID': ''
    }
  }
}
```

#### Chinese LLM Providers (All OpenAI-Compatible)
| Provider | API Endpoint | Notes |
|----------|-------------|-------|
| 豆包 (Doubao) | Custom endpoint + `/v1/chat/completions` | Full OpenAI compatibility |
| 千问 (Qwen) | DashScope API | OpenAI-compatible format |
| Kimi | `https://api.moonshot.ai/v1` | OpenAI & Anthropic compatible |
| GLM (Zhipu) | Custom endpoint + `/v1/chat/completions` | OpenAI-compatible |

### Technical Approach

#### Translation Strategy
1. **Smart Text Extraction**: Extract translatable text while preserving HTML structure
2. **Batch Processing**: Group text nodes for efficient LLM API calls
3. **Caching**: Store translations to reduce API calls and improve performance
4. **Progressive Rendering**: Show translations as they complete
5. **Context Preservation**: Maintain context for better translation quality

#### LLM Integration Architecture
```javascript
// Base Provider Interface
class BaseProvider {
  async translate(texts, sourceLang, targetLang) {}
  async validateConfig() {}
  getMaxBatchSize() {}
  formatPrompt(texts, sourceLang, targetLang) {}
}

// Azure OpenAI Implementation
class AzureOpenAIProvider extends BaseProvider {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }
  
  async translate(texts, sourceLang, targetLang) {
    // Implementation using Azure OpenAI API
  }
}

// Generic OpenAI-Compatible Provider
class OpenAICompatibleProvider extends BaseProvider {
  // Reusable for Doubao, Qwen, Kimi, GLM
}
```

## Implementation Stages

### Stage 1: Foundation Setup (MVP)
**Goal**: Basic extension structure with Azure OpenAI
**Deliverables**:
- manifest.json with necessary permissions
- Basic project structure
- Azure OpenAI provider implementation
- Simple text extraction

**Success Criteria**: 
- Extension loads in Chrome
- Can connect to Azure OpenAI API
- Basic translation works

### Stage 2: Content Script Implementation
**Goal**: Robust text extraction and DOM manipulation
**Deliverables**:
- Smart DOM walker
- Text batching algorithm
- Translation rendering with original structure preservation
- Loading states and progress indicators

**Success Criteria**:
- Accurately extracts text from complex pages
- Preserves page layout after translation
- Handles dynamic content

### Stage 3: UI Development
**Goal**: User-friendly popup and options page
**Deliverables**:
- Popup with quick controls
- Options page for detailed settings
- Provider configuration UI
- Language selector

**Success Criteria**:
- Intuitive configuration process
- Settings persist across sessions
- Support for multiple provider configurations

### Stage 4: Chinese LLM Integration
**Goal**: Add support for Chinese LLM providers
**Deliverables**:
- Doubao (豆包) integration
- Qwen (千问) integration  
- Kimi integration
- GLM integration
- Provider switching logic

**Success Criteria**:
- All providers work with minimal code changes
- Seamless provider switching
- Consistent translation quality

### Stage 5: Advanced Features & Optimization
**Goal**: Production-ready features and performance
**Deliverables**:
- Translation caching (IndexedDB)
- Keyboard shortcuts
- Context menu integration
- Auto language detection
- Error recovery and fallback

**Success Criteria**:
- <100ms extension startup
- <2s average page translation
- Graceful error handling

### Stage 6: Internationalization & Store Preparation
**Goal**: Global readiness
**Deliverables**:
- Multi-language UI (10+ languages)
- Chrome Web Store assets
- Privacy policy
- Documentation

**Success Criteria**:
- Passes Chrome Web Store review
- Works in all target locales

## Key Features

### MVP Features (Stage 1-2)
- [x] Azure OpenAI integration
- [x] Translate entire web pages
- [x] English ↔ Chinese translation
- [x] Basic popup interface
- [x] API configuration

### Enhanced Features (Stage 3-6)
- [ ] Multiple Chinese LLM providers (豆包, 千问, Kimi, GLM)
- [ ] International providers (OpenAI, Claude)
- [ ] Selective text translation
- [ ] Translation caching
- [ ] Custom prompt templates
- [ ] Translation history
- [ ] Keyboard shortcuts (Ctrl+Shift+T)
- [ ] Context menu integration
- [ ] Auto-detect source language
- [ ] Support 20+ languages
- [ ] Translation quality feedback
- [ ] Batch page translation
- [ ] Export translations

## API Design

### Message Passing Protocol
```javascript
// Content script → Background
{
  action: 'translate',
  data: {
    texts: ['text1', 'text2'],
    sourceLang: 'auto',
    targetLang: 'zh',
    provider: 'azure-openai',
    context: 'webpage_title'
  }
}

// Background → Content script
{
  status: 'success',
  data: {
    translations: ['翻译1', '翻译2'],
    provider: 'azure-openai',
    cached: false,
    duration: 1250
  }
}

// Progress updates
{
  status: 'progress',
  data: {
    current: 10,
    total: 50,
    message: 'Translating...'
  }
}
```

### Storage Schema
```javascript
{
  // User settings
  settings: {
    defaultSourceLang: 'auto',
    defaultTargetLang: 'zh',
    activeProvider: 'azure-openai',
    autoTranslate: false,
    translationDisplay: 'replace', // replace, dual, hover
    shortcuts: {
      toggleTranslation: 'Ctrl+Shift+T',
      selectTranslate: 'Alt+T'
    }
  },
  
  // Provider configurations
  providers: {
    'azure-openai': {
      endpoint: 'encrypted_endpoint',
      apiKey: 'encrypted_key',
      apiVersion: '2024-03-01-preview',
      model: 'gpt-5-chat-2025-08-07',
      enabled: true
    },
    'doubao': {
      endpoint: 'encrypted_endpoint',
      apiKey: 'encrypted_key',
      model: 'doubao-pro',
      enabled: false
    }
    // ... other providers
  },
  
  // Translation cache
  cache: {
    'hash_of_text_and_langs': {
      translation: 'translated_text',
      provider: 'azure-openai',
      timestamp: 1234567890,
      hits: 5
    }
  },
  
  // Usage statistics
  stats: {
    totalTranslations: 1000,
    totalCharacters: 50000,
    providerUsage: {
      'azure-openai': 800,
      'doubao': 200
    }
  }
}
```

## Technical Considerations

### Performance Optimization
- Lazy loading of provider modules
- Text batching (max 50 texts per request)
- Request debouncing (300ms)
- DOM updates via DocumentFragment
- Virtual scrolling for long pages
- Web Workers for heavy processing

### Security
- API keys encrypted with Chrome's built-in encryption
- Content Security Policy (CSP) compliance
- XSS prevention in translated content
- HTTPS-only API communications
- No external analytics or tracking
- Minimal permissions requested

### Error Handling
```javascript
// Graceful degradation strategy
try {
  // Primary provider
  result = await primaryProvider.translate();
} catch (error) {
  // Fallback provider
  if (fallbackProvider) {
    result = await fallbackProvider.translate();
  } else {
    // Show user-friendly error
    showError('Translation temporarily unavailable');
  }
  // Log for debugging
  console.error('Translation error:', error);
}
```

### Chrome Web Store Requirements
- [ ] Detailed privacy policy
- [ ] Clear description in multiple languages
- [ ] 5 screenshots (1280x800)
- [ ] Promotional images (440x280, 920x680)
- [ ] Video demo (optional)
- [ ] Justification for permissions
- [ ] No obfuscated code
- [ ] Performance benchmarks documented

## Development Setup

### Prerequisites
```bash
# Node.js 18+
# Chrome 120+
# npm or pnpm
```

### Commands
```bash
npm install        # Install dependencies
npm run dev       # Development mode with hot reload
npm run build     # Production build
npm run test      # Run tests
npm run lint      # Lint code
npm run package   # Create .zip for Chrome Web Store
```

## Testing Strategy

### Unit Tests
- Provider implementations
- Text extraction algorithms
- Translation caching
- Storage operations

### Integration Tests
- API communication
- Message passing
- DOM manipulation
- Cross-browser compatibility

### E2E Tests
- Full translation flow
- Provider switching
- Error scenarios
- Performance benchmarks

## Roadmap

### Q1 2025 - MVP Release
- ✅ Azure OpenAI integration
- ✅ Basic translation functionality
- ✅ Chrome Web Store submission

### Q2 2025 - Chinese Market
- Chinese LLM providers
- Optimized for Chinese websites
- Local distribution channels

### Q3 2025 - Global Expansion
- 20+ language support
- More international providers
- Enterprise features

### Q4 2025 - Advanced Features
- AI-powered glossaries
- Team collaboration
- Translation memory
- API for developers

## Next Steps
1. Create manifest.json with minimal permissions
2. Implement Azure OpenAI provider
3. Build basic content script
4. Create simple popup UI
5. Test on sample websites