# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用开发命令

### 开发环境
- `pnpm dev` - 启动开发服务器（TypeScript 自动编译 + 热重载）
- `pnpm run build:ts` - 编译 TypeScript 到 dist 目录
- `pnpm run watch:ts` - 监听模式编译 TypeScript

### 测试和检查
- `pnpm test` - 运行所有测试（使用 Node.js 内置测试框架）
- `pnpm run lint` - 运行 ESLint 检查
- `pnpm run lint:fix` - 自动修复 ESLint 错误
- `pnpm run format` - 检查 Prettier 格式
- `pnpm run format-fix` - 自动格式化代码

### 数据库操作
- `pnpm run db:create` - 创建数据库
- `pnpm run db:seed` - 数据库种子数据

### 生产环境
- `pnpm start` - 启动生产服务器

## 项目架构

### 核心技术栈
- **框架**: Fastify 5.x - 高性能 Node.js Web 框架
- **类型系统**: TypeScript + TypeBox (JSON Schema 类型推导)
- **数据库**: MySQL + Drizzle ORM
- **工具**: ESLint + Prettier + tsx

### 架构模式
这是一个基于 Fastify 插件系统的现代化后端应用，采用"一切皆插件"的设计理念：

1. **插件加载顺序** (src/app.ts):
   - `plugins/external/` - 外部插件（数据库、CORS、安全等）
   - `plugins/app/` - 应用插件（业务逻辑、repositories）
   - `routes/` - 路由处理（带自动钩子）

2. **目录结构**:
   - `plugins/external/` - 第三方插件配置（cors、db、env、helmet、rate-limit 等）
   - `plugins/app/` - 应用业务插件（users repository、password manager）
   - `routes/api/` - API 路由实现
   - `schemas/` - TypeBox 验证和序列化 schema
   - `db/` - Drizzle ORM 数据库模式和类型
   - `config/` - 应用配置和常量
   - `utils/` - 通用工具函数

### 关键约定

1. **类型和验证**: 使用 TypeBox + @fastify/type-provider-typebox 统一类型推导和验证
2. **数据库**: 使用 Drizzle ORM，避免手写 SQL
3. **响应格式**: 返回 `{ statusCode, message, result }` 格式
4. **错误处理**: 全局错误处理器和 404 处理器（带速率限制）
5. **日志系统**: 多目标日志记录（控制台 + 文件）

### 状态码规范
- 使用标准 HTTP 状态码
- 可选业务码：HTTP状态码 + 三位业务码（如 403002）
- 200: 成功的 GET 请求
- 201: 创建成功（POST）
- 4xx/5xx: 错误响应必须包含详细错误信息

### 安全特性
- Helmet 安全头
- CORS 跨域配置
- Rate Limiting 速率限制
- Under Pressure 负载监控
- 404 请求速率限制（防止URL探测）

### 测试
- 使用 Node.js 内置测试框架
- 测试文件位于 `test/` 目录
- 支持 TypeScript 测试文件
- 使用 c8 进行代码覆盖率检查