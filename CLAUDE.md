# WebTranslator Chrome Extension - Project Context

## 项目概述
WebTranslator 是一个 Chrome 浏览器扩展，用于将网页内容翻译成用户指定的语言。该扩展支持多种 LLM 后端，包括 Azure OpenAI（MVP）和中国国产大模型。

## 当前进展

### 已完成
1. **需求分析**：明确了将网页从一种语言翻译成另一种语言的核心功能
2. **技术调研**：
   - Azure OpenAI 作为 MVP 版本的主要后端
   - 调研了中国国产模型（豆包、千问、Kimi、GLM）的 API，发现都支持 OpenAI 兼容格式
3. **架构设计**：完成了详细的实现计划（见 IMPLEMENTATION_PLAN.md）
4. **MVP 完整实现**：
   - ✅ Chrome Extension Manifest V3 配置
   - ✅ Azure OpenAI Provider 集成
   - ✅ 智能内容脚本（文本提取和DOM处理）
   - ✅ 现代化 popup 界面（渐变设计）
   - ✅ 完整的设置页面（options page）
   - ✅ 双语显示翻译功能
   - ✅ 渐进式批量翻译
   - ✅ 还原原文功能
   - ✅ 错误处理和重试机制
5. **UI/UX 优化**：
   - ✅ 现代渐变设计风格
   - ✅ 智能内容识别（避免翻译代码块、导航菜单）
   - ✅ 双语显示格式优化（标题括号、内容块、侧边栏内联）
   - ✅ 去除中文翻译斜体样式
   - ✅ 响应式加载指示器
6. **完整项目文档**：
   - ✅ 专业双语 README.md（英文+中文）
   - ✅ 详细安装和使用指南
   - ✅ 开发文档和架构说明

### 技术决策
1. **MVP 使用 Azure OpenAI**
   - Endpoint: `https://xx/gpt_openapi`
   - API Version: `2024-03-01-preview`
   - 支持自定义 headers（如 X-TT-LOGID）

2. **支持的 LLM 提供商**（计划）
   - Azure OpenAI (MVP)
   - 豆包 (Doubao) - OpenAI 兼容
   - 千问 (Qwen) - OpenAI 兼容
   - Kimi (Moonshot) - OpenAI 兼容
   - GLM (智谱) - OpenAI 兼容
   - OpenAI
   - Claude

3. **核心架构**
   - 模块化 Provider 系统
   - 基于 Chrome Extension Manifest V3
   - 支持国际化（i18n）
   - 缓存机制提升性能

## 项目结构
```
WebTranslator/
├── manifest.json          # Chrome 扩展清单
├── src/
│   ├── background/       # Service Worker
│   │   └── llm-providers/  # LLM 提供商集成
│   ├── content/          # 内容脚本
│   ├── popup/            # 弹出界面
│   └── options/          # 设置页面
├── _locales/             # 多语言支持
└── IMPLEMENTATION_PLAN.md # 详细实现计划
```

## 实现详情

### 关键技术突破
1. **智能内容提取算法**：
   - 使用 TreeWalker API 遍历 DOM
   - 优先选择内容元素（p, h1-h6, li）而非大容器
   - 自动过滤代码块、脚本、导航元素
   - 避免重叠元素选择，防止重复翻译

2. **双语显示策略**：
   - 标题：原文 + (译文) 括号格式
   - 内容：原文下方显示译文块
   - 侧边栏：原文 + 译文内联格式
   - 保持原HTML结构和内联元素

3. **渐进式翻译机制**：
   - 5个元素为一批处理
   - 显示加载指示器
   - 批次间200ms延迟提升用户体验
   - 支持大页面翻译不阻塞UI

4. **错误处理和调试**：
   - 详细的API调用日志（遮蔽API密钥）
   - 3次重试机制
   - 用户友好的错误提示
   - 扩展注入失败自动重试

5. **LLM Prompt 优化**：
   - 专业翻译角色定位
   - Native speaker质量要求
   - 短句优化指导
   - 多语言支持（11种语言）
   - 保持语调和技术术语准确性
   - 格式保持和流畅性要求

### 调试解决的关键问题
1. **元素提取过于严格**：修改过滤逻辑，从只找到1个元素提升到多个
2. **中文翻译破坏内联HTML**：从文本节点级改为元素级翻译
3. **Azure API认证问题**：支持自定义endpoint和api-key header
4. **导航菜单被翻译**：增加导航元素检测和排除逻辑
5. **翻译效果不明显**：优化双语显示格式和样式
6. **翻译质量提升**：优化LLM prompt以获得更自然的native speaker质量翻译

## 下一步工作

### Stage 2: 扩展功能（优先级高）
- [ ] 集成中国 LLM 提供商（豆包、千问、Kimi、GLM）
- [ ] 国际化支持（i18n）
- [ ] Chrome Web Store 优化和上架准备

### Stage 3: 高级功能（中等优先级）
- [ ] 翻译缓存机制
- [ ] 键盘快捷键支持
- [ ] 右键菜单集成
- [ ] 自定义翻译提示词
- [ ] 选择性文本翻译

### Stage 4: 性能和体验优化（低优先级）
- [ ] 更智能的内容检测算法
- [ ] 支持更多网站类型（SPA、动态内容）
- [ ] 翻译质量评估
- [ ] 用户使用统计和分析

## 技术要点

### 翻译策略
- 智能文本提取，保持 HTML 结构
- 批量处理文本以优化 API 调用
- 缓存翻译结果
- 渐进式渲染

### 安全考虑
- API 密钥加密存储
- CSP 合规
- XSS 防护
- HTTPS only

### 性能目标
- 启动时间 < 100ms
- 平均页面翻译 < 2s
- 支持大页面的渐进式翻译

## 开发指南

### 环境要求
- Node.js 18+
- Chrome 120+
- npm/pnpm

### 开发命令
```bash
npm install       # 安装依赖
npm run dev      # 开发模式
npm run build    # 生产构建
npm run test     # 运行测试
npm run package  # 打包扩展
```

## API 示例

### Azure OpenAI 配置
```javascript
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

### 优化后的翻译 Prompt
```
You are a professional web content translator. Translate the following texts from en to zh.

Translation guidelines:
- Write like a native Chinese speaker would naturally express these ideas
- Use shorter, clearer sentences when possible without changing the meaning
- Maintain the original tone and formality level
- Keep technical terms accurate but accessible
- Ensure the translation flows naturally and reads smoothly
- Preserve any formatting or special characters

Return only the translations, numbered exactly as shown:

1. GPT-5, our newest flagship model, represents a substantial leap forward...
2. While we trust it will perform excellently "out of the box"...
```

**Prompt 改进要点**：
- 🎯 专业角色定位：明确翻译者身份
- 🌟 Native speaker质量：强调自然表达
- ✂️ 短句优化：在不改变意思的前提下使用短句
- 🎨 语调保持：维持原文的正式程度和风格
- 🔧 术语平衡：技术准确性与可读性并重
- 📝 格式保持：保持原文格式和特殊字符

## 注意事项
1. MVP 版本优先支持 Azure OpenAI
2. 所有中国国产模型都提供 OpenAI 兼容接口，便于统一集成
3. 需要考虑全球用户，支持多语言 UI
4. 遵循 Chrome Web Store 的所有要求

## 参考资源
- [Chrome Extension Manifest V3 文档](https://developer.chrome.com/docs/extensions/mv3/)
- [Azure OpenAI API 文档](https://learn.microsoft.com/azure/ai-services/openai/)
- IMPLEMENTATION_PLAN.md - 详细的实现计划和技术细节

## 文件清单

### 核心文件
- `manifest.json` - Chrome扩展清单文件（MV3）
- `src/background/service-worker.js` - 后台服务脚本
- `src/background/llm-providers/azure-openai.js` - Azure OpenAI集成
- `src/content/translator.js` - 内容脚本（翻译逻辑）
- `src/content/styles.css` - 翻译样式
- `src/popup/popup.html|js|css` - 弹窗界面
- `src/options/options.html|js|css` - 设置页面

### 项目配置
- `package.json` - 项目依赖和脚本
- `README.md` - 双语项目文档
- `CLAUDE.md` - 项目上下文和实现记录
- `IMPLEMENTATION_PLAN.md` - 详细实现计划
- `icons/` - 扩展图标文件

### 注意事项
1. **API密钥安全**：所有API密钥通过Chrome storage API加密存储
2. **CSP合规**：所有内联脚本和样式符合内容安全策略
3. **性能优化**：使用批量翻译和缓存机制
4. **用户体验**：渐进式加载和错误处理
5. **代码质量**：详细的调试日志和错误处理

### 接手工作指南
1. **环境准备**：Node.js 18+, Chrome 120+
2. **安装依赖**：`npm install`
3. **开发模式**：在 `chrome://extensions/` 加载解压的扩展
4. **测试方法**：访问英文网页，点击扩展图标翻译
5. **调试技巧**：打开Chrome DevTools Console查看详细日志

---
*最后更新：2025-08-17*
*状态：MVP完成，功能完整可用，准备Stage 2扩展*