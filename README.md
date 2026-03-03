# Fastify template

基于 [Fastify](https://fastify.dev) 的现代 TypeScript 后端开发模板，内置多种常用插件和开发工具，支持模块化、类型安全、编程式 SQL 构建（Kysely + SQLite）及严格的代码风格校验。

## ✨ 特性

- ⚡ 极速的 Fastify 框架（独立模式，无 fastify-cli）
- 🧱 TypeBox 类型推导 + 校验一体化
- 🔐 Helmet + CORS + Rate Limit 安全方案
- 📊 Kysely + SQLite（better-sqlite3）支持
- 🔌 插件自动加载机制
- 🌲 日志和错误友好处理（`@fastify/sensible` + pino）
- 🛑 `close-with-grace` 优雅退出
- ✅ 严格类型、ESLint、Prettier 格式统一
- 🚀 支持 `tsx` 无需构建直接运行

## 🚀 快速开始

```bash
# Clone template
pnpm dlx degit Pony-Unicorn/fastify-template my-project
cd my-project

pnpm i

# Development
pnpm dev
```

## 📐 规范与开发指南

为了保持代码质量和一致性，本项目遵循严格的编码规范和 API 设计准则。

👉 **详细的技术规范、架构设计和项目目录结构请参考：[AGENTS.md](./AGENTS.md)**

### 核心要点简述
- **API 风格**: 遵循 RESTful 语义与 GitHub API 响应风格。
- **数据库**: 使用 Kysely + Repository 模式。
- **校验**: 全程 TypeBox 类型安全保障。
- **命名**: 路由使用 kebab-case，SQL 文件带三位编号。

## 🌟 推荐依赖（未预安装，可按需引入）

以下是一些在实际开发中常用且优秀的插件和工具库：

| 包名                                                                             | 说明                                              |
| -------------------------------------------------------------------------------- | ------------------------------------------------- |
| [`@fastify/auth`](https://github.com/fastify/fastify-auth)                       | 多重认证策略支持，可组合多个鉴权方案              |
| [`@fastify/jwt`](https://github.com/fastify/fastify-jwt)                         | JWT 签发与验证插件，适合构建登录系统或 API 鉴权   |
| [`@fastify/cookie`](https://github.com/fastify/fastify-cookie)                   | 用于处理 HTTP Cookie，配合认证或 session 常用     |
| [`@fastify/session`](https://github.com/fastify/session)                         | 基于 Cookie 的会话管理插件                        |
| [`@fastify/multipart`](https://github.com/fastify/fastify-multipart)             | 支持文件上传，支持多文件、流式传输                |
| [`@fastify/static`](https://github.com/fastify/fastify-static)                   | 静态文件服务，适合部署前端资源或文件下载          |
| [`@fastify/swagger`](https://github.com/fastify/fastify-swagger)                 | 自动生成 OpenAPI 规范的 API 文档                  |
| [`@fastify/swagger-ui`](https://github.com/fastify/fastify-swagger-ui)           | 配合 `@fastify/swagger` 展示 Swagger UI 界面      |
| [`@fastify/request-context`](https://github.com/fastify/fastify-request-context) | 不传 req 也能拿到本次请求数据，且并发不串台       |
| [`csv-stringify`](https://csv.js.org/stringify/)                                 | 将数据导出为 CSV 格式，适用于报表、数据导出等场景 |

> 这些依赖尚未包含在项目中，可根据实际需求通过 `pnpm add 包名` 安装使用。

## 安全防护

- 尽量使用 cloudflare 代理流量，并且在云服务提供商设置防火墙只允许 cf ip 访问
  - cloudflare ips https://www.cloudflare.com/zh-cn/ips/

## 常用命令

### 包管理

- 查看当前有哪些包已过时 pnpm outdated
- 升级到 semver 范围内的最新版本 pnpm up
- 将依赖升级到最新版本 pnpm up -L fastify

### 数据库操作

```bash
# 1. 创建数据库文件
pnpm run db:create

# 2. 用 GUI 或 CLI 工具执行 sql/ 目录下的 .sql 文件建表
#    例：sqlite3 ./data/app.db < sql/000-init.sql

# 3. 生成 Kysely 类型（需数据库已存在）
pnpm run db:types

# 4. 插入种子数据（仅开发环境）
pnpm run db:seed
```

**Schema 管理说明：**

- `sql/` 目录是表结构的唯一来源，命名格式：`<三位数编号>-<语义化文件名>.sql`
- 使用 GUI 工具（TablePlus、DB Browser）或 `sqlite3` CLI 直接执行 `.sql` 文件
- 表结构变更时同步更新对应 `.sql` 文件，然后重新运行 `db:types` 刷新类型

## 🤖 AI Coding Support

本项目已内置 AI coding 支持，适配常见开发工具与协作流程：

- **Codex** — 通过 `AGENTS.md` 约束项目规范与工作流
- **Claude Code** — 通过 `CLAUDE.md` 提供编码指引
- **Gemini CLI** — 通过 `AGENTS.md` 约束项目规范与工作流

建议在使用 AI 辅助开发前先阅读上述文件，确保输出符合项目规范。

[更多查看](https://www.yuque.com/pony13500815917/computer/xt0tdduk7mpt5bdf?singleDoc)

## Deployment
- 编译代码 `pnpm run build`
- 压缩包 `tar -czvf release.tar.gz dist/ package.json pnpm-lock.yaml`
- 上传服务器 `scp release.tar.gz 用户名@服务器IP:~/`
- 进入项目目录 `cd /data/www/myapp`
- 删除 dist 目录 `rm -rf ./dist`
- 解压并覆盖 `tar -xzvf ~/release.tar.gz -C ./`
- 安装依赖 `pnpm install --frozen-lockfile --prod`
- PM2 重载（入口：`dist/server.js`）

## ✅ Todo List

- [ ] 使用命令行生成 zod 验证，使用 https://github.com/sinclairzx81/typebox-codegen
- [ ] 开发刷新代码