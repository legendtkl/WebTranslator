# WebTranslator Extension Testing Guide

## Chrome 扩展加载和测试步骤

### 1. 在 Chrome 中加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 WebTranslator 项目根目录
6. 确认扩展已加载，图标出现在工具栏

### 2. 配置 Azure OpenAI

1. 点击扩展图标，然后点击"Settings"
2. 填写 Azure OpenAI 配置：
   - **Endpoint URL**: `https://your-resource.openai.azure.com/openai`
   - **API Version**: `2024-03-01-preview`
   - **API Key**: `your-api-key`
   - **Model**: `gpt-4` 或你的部署名称
   - **Max Tokens**: `1000`
   - **Custom Headers**: `{"X-TT-LOGID": ""}` (如果需要)

3. 点击"Test Connection"验证配置
4. 点击"Save Settings"保存

### 3. 测试翻译功能

#### 测试页面推荐
- 英文新闻网站：https://www.bbc.com/news
- 中文网站：https://news.sina.com.cn
- 技术文档：https://developer.mozilla.org

#### 测试步骤
1. 访问任意包含文本的网页
2. 点击 WebTranslator 扩展图标
3. 选择源语言和目标语言
4. 点击"Translate Page"
5. 观察页面文本是否被翻译

### 4. 预期行为

#### 成功情况
- ✅ 扩展图标正常显示
- ✅ Popup 界面加载正常
- ✅ 设置页面可以打开和配置
- ✅ 测试连接显示成功
- ✅ 页面文本被翻译替换
- ✅ 页面布局保持不变

#### 常见问题

**问题 1: 扩展无法加载**
- 检查 manifest.json 语法
- 查看 Chrome 扩展页面的错误信息

**问题 2: 翻译失败**
- 检查 Azure OpenAI 配置是否正确
- 查看浏览器开发者工具的 Console 错误
- 验证 API Key 是否有效

**问题 3: 页面显示异常**
- 某些动态网站可能不兼容
- 检查 content script 是否正确注入

### 5. 调试技巧

#### 查看扩展日志
1. 访问 `chrome://extensions/`
2. 点击 WebTranslator 的"详细信息"
3. 点击"检查视图: Service Worker"
4. 查看 Console 中的日志

#### 查看内容脚本日志
1. 在目标网页按 F12 打开开发者工具
2. 切换到 Console 标签
3. 查看翻译相关的日志信息

#### 检查存储数据
1. 在开发者工具中，切换到 Application 标签
2. 左侧选择 Storage > Extension Storage
3. 查看 WebTranslator 的存储数据

### 6. 测试用例

#### 基本功能测试
- [ ] 扩展安装成功
- [ ] Popup 界面正常显示
- [ ] 设置页面可以打开
- [ ] 可以保存 Azure OpenAI 配置
- [ ] 连接测试成功
- [ ] 英文页面翻译成中文
- [ ] 中文页面翻译成英文

#### 边界情况测试
- [ ] API Key 错误时的错误处理
- [ ] 网络断开时的行为
- [ ] 空页面的处理
- [ ] 包含大量文本的页面
- [ ] 动态加载内容的页面

#### 用户体验测试
- [ ] 翻译进度指示器显示
- [ ] 错误信息友好显示
- [ ] 设置数据持久化
- [ ] 语言选择记忆功能

### 7. 性能测试

#### 测试指标
- 扩展启动时间 < 100ms
- 小页面翻译时间 < 2s
- 大页面翻译时间 < 10s
- 内存使用 < 50MB

#### 测试方法
1. 使用 Chrome DevTools Performance 标签
2. 记录扩展执行过程
3. 分析性能瓶颈

### 8. 问题报告

如发现问题，请记录以下信息：
- Chrome 版本
- 操作系统
- 扩展版本
- 重现步骤
- 错误截图
- Console 错误日志

---

## 快速测试命令

```bash
# 代码检查
npm run lint

# 验证扩展清单
npm run validate

# 打包扩展
npm run package
```

## 下一步

测试通过后，可以继续：
1. 添加中国 LLM 提供商支持
2. 实现国际化
3. 优化性能
4. 准备 Chrome Web Store 发布