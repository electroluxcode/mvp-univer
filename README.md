# MVP AI Model (Next.js)

本地运行 AI 模型的 Next.js 应用，使用 transformers.js 在浏览器中直接运行机器学习模型。

## 🚀 特性

- ✅ 在浏览器中运行 AI 模型（无需服务器）
- ✅ 自动使用 HF-Mirror 加速模型下载（国内优化）
- ✅ Next.js API 代理解决 CORS 问题
- ✅ 支持文本分类、情感分析、翻译等多种任务
- ✅ 自动重试机制（镜像站失败自动切换到官方源）

## 📦 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 🌐 网络代理说明

本项目已经**自动配置**了 HF-Mirror 国内镜像站，无需手动设置：

- 🔄 所有 Hugging Face 模型请求自动通过 Next.js API 代理
- 🚀 优先使用 `hf-mirror.com` 国内镜像（速度快）
- 🔁 镜像站失败时自动切换到 `huggingface.co` 官方源
- ✅ 完美解决 CORS 跨域问题

**工作原理：**
```
浏览器 → fetch 拦截器 → Next.js API (/api/proxy/huggingface) → HF-Mirror → 返回模型文件
```

## 📖 使用方法

### 1. 📦 模型管理
   - 点击"显示预设模型"查看可用模型
   - 选择一个模型点击"添加模型"
   - 点击"下载"按钮下载模型到浏览器缓存
   - 所有下载自动通过 HF-Mirror 加速

### 2. 🔮 推理测试
   - 下载完成后，可以在"推理测试"标签中使用模型
   - 输入文本，查看模型推理结果
   - 支持多种任务类型（文本分类、情感分析等）

### 3. 📊 状态监控（新功能）
   - 查看代理配置和系统状态
   - 测试代理连接和下载功能
   - 调试工具和性能监控
   - 验证 CORS 问题和代理工作原理

## 🛠️ 技术栈

- [Next.js 15](https://nextjs.org) - React 框架
- [Transformers.js](https://huggingface.co/docs/transformers.js) - 浏览器端 AI 推理
- [Tailwind CSS](https://tailwindcss.com) - 样式框架
- TypeScript - 类型安全

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── proxy/
│   │       └── huggingface/
│   │           └── route.ts          # Next.js API 代理路由
│   ├── page.tsx                       # 主页面
│   └── layout.tsx                     # 布局
├── components/
│   ├── ModelManager.tsx               # 模型管理组件
│   └── InferencePanel.tsx             # 推理测试组件
└── core/
    ├── transformers-proxy.ts          # Fetch 拦截器配置
    ├── model-manager.ts               # 模型管理核心逻辑
    └── proxy-manager.ts               # 代理管理器
```

## 🐛 故障排除

遇到问题？查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 获取详细的故障排除指南。

常见问题：
- 模型下载失败 → 检查网络连接，查看浏览器控制台日志
- JSON 解析错误 → 已修复，确保使用最新代码
- 下载速度慢 → 正常现象，模型文件较大（几十到几百MB）

## 📝 开发说明

### 添加新的预设模型

编辑 `src/core/model-manager.ts` 中的 `PRESET_MODELS` 数组：

```typescript
{
  id: 'your-model-id',
  name: '模型名称',
  task: 'text-classification',
  description: '模型描述'
}
```

### 调试模型下载

打开浏览器开发者工具（F12），查看控制台日志：
- `🔄 [代理]` - 代理请求日志
- `✅ [代理]` - 请求成功
- `⚠️ [代理]` - 请求警告
- `❌ [代理]` - 请求错误

## 📄 许可证

MIT

## 🙏 致谢

- [Hugging Face](https://huggingface.co) - 提供优秀的模型和工具
- [HF-Mirror](https://hf-mirror.com) - 提供国内镜像加速服务
- [Transformers.js](https://github.com/xenova/transformers.js) - 浏览器端 AI 推理库
