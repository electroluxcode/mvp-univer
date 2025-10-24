# 代理配置说明

## 📦 已完成的优化

本项目已经完成了代理系统的优化，实现了**自动化、透明化**的模型下载体验。

### ✅ 核心改进

1. **自动配置 HF-Mirror 镜像**
   - 默认使用国内 `hf-mirror.com` 镜像站
   - 无需用户手动配置
   - 自动重试机制（镜像失败时自动切换到官方源）

2. **Next.js API 代理解决 CORS**
   - 所有 Hugging Face 请求通过 `/api/proxy/huggingface` 路由
   - 完美解决跨域（CORS）问题
   - 保持二进制数据完整性（支持大型模型文件）

3. **简化的用户界面**
   - 移除了用户代理设置页面
   - 减少配置复杂度
   - 在标题栏显示 "🌐 HF-Mirror 加速" 标识

4. **智能 Fetch 拦截器**
   - 自动拦截所有 Hugging Face 相关请求
   - 支持 `huggingface.co`、`hf-mirror.com`、`cdn-lfs.huggingface.co`
   - 透明代理，无需修改 transformers.js 代码

## 🔧 工作原理

```
用户请求模型
    ↓
transformers.js 发起请求
    ↓
Fetch 拦截器检测到 HF 请求
    ↓
重定向到 /api/proxy/huggingface?path=...
    ↓
Next.js API 路由
    ↓
优先请求 hf-mirror.com
    ↓ (如果失败)
自动切换到 huggingface.co
    ↓
返回模型文件（带 CORS 头）
    ↓
transformers.js 正常处理
```

## 📁 关键文件

### 1. `/src/core/transformers-proxy.ts`
**Fetch 拦截器配置**

```typescript
export async function configureTransformersProxy(useNextjsProxy: boolean = true)
```

- 拦截所有 Hugging Face 相关请求
- 自动重定向到 Next.js API 代理
- 配置 transformers.js 环境变量

### 2. `/src/app/api/proxy/huggingface/route.ts`
**Next.js API 代理路由**

```typescript
export async function GET(request: NextRequest)
```

- 默认使用 `hf-mirror.com` 镜像
- 自动重试机制（镜像失败时使用官方源）
- 60秒超时设置
- 完整的 CORS 头支持
- 详细的日志记录

### 3. `/src/app/page.tsx`
**主应用页面**

- 应用启动时自动配置代理
- 简化的双标签页界面（模型管理 + 推理测试）
- 显示 "HF-Mirror 加速" 状态标识

## 🧪 测试方法

### 方法 1: 使用测试页面

访问 http://localhost:3000/test-proxy

1. 点击"测试单个文件" - 测试基本代理功能
2. 点击"测试多个文件" - 测试批量下载
3. 点击"直接测试镜像站" - 验证 CORS 问题（应该失败，证明需要代理）

### 方法 2: 使用浏览器控制台

打开主页 http://localhost:3000，按 F12 打开开发者工具：

1. 查看控制台日志：
   ```
   🚀 Next.js 应用启动，自动配置代理（HF-Mirror）...
   ✅ 网络请求拦截器已设置（使用 Next.js API 代理）
   📋 Transformers.js 环境配置:
     - allowLocalModels: false
     - useBrowserCache: false
     - allowRemoteModels: true
   ```

2. 下载一个模型，观察日志：
   ```
   🔄 拦截并代理请求: https://huggingface.co/.../config.json
      → 代理路径: /api/proxy/huggingface?path=...
   ✅ 代理请求成功
      📄 响应内容类型: application/json
   ```

3. 在 Network 标签中查看请求：
   - 所有 HF 请求都应该指向 `/api/proxy/huggingface`
   - 响应状态应该是 200
   - 响应头应包含 `Access-Control-Allow-Origin: *`

### 方法 3: 查看服务器日志

在运行 `npm run dev` 的终端中，应该看到：

```
🔄 [代理] 请求路径: /Xenova/distilbert-base-uncased-finetuned-sst-2-english/resolve/main/config.json
   → 目标URL: https://hf-mirror.com/...
✅ [代理] 镜像站请求成功 (耗时: 234ms)
   📄 响应类型: application/json
   📦 响应大小: 0.01 MB
```

## 🐛 故障排除

### 问题 1: 模型下载失败，显示 JSON 解析错误

**原因**: 可能没有正确配置代理

**解决方案**:
1. 刷新页面（Ctrl/Cmd + Shift + R）
2. 检查控制台是否显示 "✅ 网络请求拦截器已设置"
3. 检查 Network 标签，确认请求通过 `/api/proxy/huggingface`

### 问题 2: 请求超时

**原因**: 网络连接慢或模型文件过大

**解决方案**:
1. 检查网络连接
2. 尝试下载更小的模型（如 distilbert）
3. 等待更长时间（大型模型可能需要几分钟）

### 问题 3: 所有请求都失败

**原因**: 可能是 HF-Mirror 和官方源都无法访问

**解决方案**:
1. 访问 https://hf-mirror.com 检查镜像站是否可用
2. 检查防火墙/代理设置
3. 尝试使用 VPN

### 问题 4: 控制台显示 CORS 错误

**原因**: 请求没有通过代理

**解决方案**:
1. 确认 fetch 拦截器已设置（查看控制台日志）
2. 检查 `/api/proxy/huggingface/route.ts` 文件是否存在
3. 重启开发服务器

## 📊 性能优化建议

1. **使用小型模型测试**
   - `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (~67MB)
   - `Xenova/bert-base-multilingual-uncased-sentiment` (~135MB)

2. **避免同时下载多个模型**
   - 浏览器可能会限制并发请求
   - 大文件下载会占用大量内存

3. **清理浏览器缓存**
   - 定期清理 IndexedDB 和缓存存储
   - 避免存储过多已下载的模型

## 🔐 安全注意事项

1. **API 路由是公开的**
   - 任何人都可以通过 `/api/proxy/huggingface` 访问代理
   - 建议添加速率限制（如果部署到生产环境）

2. **不要信任用户输入**
   - 当前实现会信任所有路径参数
   - 生产环境应添加路径验证和白名单

3. **超时设置**
   - 当前设置为 60 秒
   - 可根据需要调整 `REQUEST_TIMEOUT` 常量

## 📚 相关资源

- [Transformers.js 文档](https://huggingface.co/docs/transformers.js)
- [HF-Mirror 镜像站](https://hf-mirror.com)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 🎯 未来改进计划

- [ ] 添加进度显示（显示实际下载字节数）
- [ ] 支持断点续传
- [ ] 添加下载队列管理
- [ ] 实现模型文件的本地缓存管理
- [ ] 添加速率限制和 API Key 支持
- [ ] 支持更多镜像站（可配置的镜像列表）

---

**最后更新**: 2025-10-06
**状态**: ✅ 已完成并测试

