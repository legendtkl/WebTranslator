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

## 下一步工作

### 立即需要实现（Stage 1 - MVP）
1. [ ] 创建 manifest.json 配置文件
2. [ ] 实现 Azure OpenAI Provider
3. [ ] 基础内容脚本（文本提取）
4. [ ] 简单的 popup 界面
5. [ ] 基本的翻译功能

### 后续迭代
- Stage 2: 完善内容脚本和 DOM 处理
- Stage 3: UI 开发（popup 和 options 页面）
- Stage 4: 集成中国 LLM 提供商
- Stage 5: 高级功能和优化
- Stage 6: 国际化和 Chrome 商店准备

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

## 注意事项
1. MVP 版本优先支持 Azure OpenAI
2. 所有中国国产模型都提供 OpenAI 兼容接口，便于统一集成
3. 需要考虑全球用户，支持多语言 UI
4. 遵循 Chrome Web Store 的所有要求

## 参考资源
- [Chrome Extension Manifest V3 文档](https://developer.chrome.com/docs/extensions/mv3/)
- [Azure OpenAI API 文档](https://learn.microsoft.com/azure/ai-services/openai/)
- IMPLEMENTATION_PLAN.md - 详细的实现计划和技术细节

---
*最后更新：2025-01-17*
*下一步：开始实现 manifest.json 和基础扩展结构*