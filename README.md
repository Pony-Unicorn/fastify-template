# Fastify template

基于 [Fastify](https://fastify.dev) 的现代 TypeScript 后端开发模板，内置多种常用插件和开发工具，支持模块化、类型安全、编程式 SQL 构建（基于 Drizzle ORM）及严格的代码风格校验。

## ✨ 特性

- ⚡ 极速的 Fastify 框架
- 🧱 TypeBox 类型推导 + 校验一体化
- 🔐 Helmet + CORS + Rate Limit 安全方案
- 📊 Drizzle ORM + MySQL 支持
- 🔌 插件自动加载机制
- 🌲 日志和错误友好处理（`@fastify/sensible`）
- ✅ 严格类型、ESLint、Prettier 格式统一
- 🚀 支持 `tsx` 无需构建直接运行
- [编码规范](https://www.yuque.com/pony13500815917/computer/1556e1e356e8b8d24ea1540304921f61)

## 🚀 快速开始

```bash
# Clone template
pnpm dlx degit Pony-Unicorn/fastify-template my-project
cd my-project

pnpm i

# Development
pnpm dev
```

## 📐 规范

- 提交前执行 lint 或 format 进行代码格式化
- 使用 TypeBox + @fastify/type-provider-typebox 来统一类型和验证。
- SQL 构建器使用 drizzle-orm 框架，避免手写 SQL 语句。
- API 接口设计采用 **RESTful 风格**（资源导向 + HTTP 语义）
  - 参考主流实践：[GitHub API](https://docs.github.com/en/rest)、[Stripe API](https://stripe.com/docs/api)
  - 参考 [RESTful API 设计参考文献列表](https://github.com/aisuhua/restful-api-design-references)
  - 参考 [good API design](https://www.seangoedecke.com/good-api-design/)
  - 注：采用实用主义 REST，不强制要求 HATEOAS
- 认证采用 `Authorization: <type> <credentials>` 方式（**计划中**）
  - Bearer、tma、personal_sign

### API 响应设计（GitHub API 风格）

本项目采用 **纯 HTTP 语义** 的 API 设计风格，参考 GitHub、Stripe 等主流 API 设计：

#### 响应格式规范

**成功响应**：直接返回数据，不使用包装对象

```typescript
// ✅ 单个资源
GET /api/users/me?email=user@example.com
→ HTTP 200
→ { "username": "john", "email": "user@example.com" }

// ✅ 集合资源（列表） sort 默认 desc 降序排序
GET /api/users/?page=2&page_size=20&sort=name:asc,created_at
→ HTTP 200
→ { "items": [...], "total": 100, "page": 2, "pageSize": 20 }

// ✅ 空集合（用户存在但没有 posts）
GET /api/users/123/posts
→ HTTP 200
→ { "items": [], "total": 0, "page": 1, "pageSize": 20 }

// ✅ 创建成功
POST /api/users/
→ HTTP 201
→ { "message": "User registered successfully" }
```

**错误响应**：使用 `@fastify/sensible` 抛出标准 HTTP 错误

```typescript
// ❌ 资源不存在
GET /api/users/me?email=notfound@example.com
→ HTTP 404
→ { "message": "User not found" }

// ❌ 参数验证失败
POST /api/users/ (invalid email)
→ HTTP 400
→ { "message": "body/email must match format \"email\"" }

// ❌ 认证失败
PATCH /api/users/me/password (wrong password)
→ HTTP 401
→ { "message": "Invalid current password" }

// ❌ 资源冲突
POST /api/users/ (email already exists)
→ HTTP 409
→ { "message": "User already exists" }

// ❌ 服务器错误
GET /api/users/me (database error)
→ HTTP 500
→ { "message": "Internal Server Error" }
```

#### HTTP 状态码使用规范

参考：[MDN HTTP Status](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)

**2xx 成功**

- `200 OK` - GET 请求成功，或 PUT/PATCH/DELETE 操作完成（**推荐优先使用**）
- `201 Created` - POST 创建资源成功
- `202 Accepted` - 请求已接受，但处理尚未完成（异步任务场景）
- `204 No Content` - 操作成功但无需返回数据（如 DELETE）

> 💡 **最佳实践**：大部分场景使用 `200 OK` 即可，只有在明确需要区分资源创建（201）或异步处理（202）时才使用特定状态码。

**4xx 客户端错误**

- `400 Bad Request` - 请求参数格式错误、验证失败
- `401 Unauthorized` - 未认证或认证失败
- `403 Forbidden` - 已认证但无权限访问
- `404 Not Found` - 资源不存在
- `409 Conflict` - 资源冲突（如重复创建）
- `422 Unprocessable Entity` - 业务逻辑错误（如余额不足）

**5xx 服务器错误**

- `500 Internal Server Error` - 服务器内部错误（如数据库连接失败）
- `503 Service Unavailable` - 服务暂时不可用

#### 错误处理实现

使用 `@fastify/sensible` 提供的 `reply` 错误方法：

```typescript
// 统一使用 reply 方法返回错误
return reply.notFound('User not found')
return reply.badRequest('Invalid email format')
return reply.unauthorized('Invalid credentials')
return reply.conflict('User already exists')
return reply.internalServerError('Database error')
return reply.unprocessableEntity('Insufficient balance')

// 不带消息（使用默认消息）
return reply.notFound()
```

> ⚠️ **注意**：统一使用 `return reply.xxx()` 形式，不使用 `throw fastify.httpErrors.xxx()`，保持代码风格一致。

#### 集合 vs 单个资源的 404 规则

**关键原则**：

- **集合查询**（列表）→ 空结果返回 `200 + []`
- **单个资源**（详情）→ 不存在返回 `404`

```typescript
// ✅ 集合为空 → 200
GET /api/users/123/posts  // 用户存在，但没有发表任何 post
→ HTTP 200
→ { "items": [], "total": 0 }

// ❌ 父资源不存在 → 404
GET /api/users/999/posts  // 用户本身不存在
→ HTTP 404
→ { "message": "User not found" }

// ❌ 单个资源不存在 → 404
GET /api/posts/123  // 特定的 post 不存在
→ HTTP 404
→ { "message": "Post not found" }
```

#### 开发规范

- ✅ 无特殊情况必须使用 `async/await` 形式
- ✅ 成功响应直接 `return` 数据对象，无需包装
- ✅ 错误使用 `return reply.xxx()` 返回（统一风格）
- ✅ 充分利用 TypeBox schema 进行参数验证
- ✅ 优先使用 `200 OK`，特殊场景才用 `201`/`202`/`204`
- ❌ 不使用 1xx 状态码
- ❌ 不使用业务状态码（如 40401、50001），完全依赖 HTTP 状态码

- schema: 尽量写好 schema, 使用 @sinclair/typebox 库
- routes:
  - 路由目录，一个文件为一个模块
  - controller 耦合到 route 中，service 耦合到 plugins 中
  - 命名方式为 kebab-case，示例 /portfolio-tracker，可读性高、SEO 友好、Web 标准
- 配置文件和常量统一放到 config 目录
- sql 文件，<三位数编号>-<语义化文件名>.sql 在文件头部要明确写清楚注释
  - 000-init.sql # 初始化、最原始的 sql 文件
  - 001-create-posts-table.sql # 新建表
  - 002-create-posts-indexes.sql # 创建索引
  - 003-posts-seed.sql
- log 日志
  - 本地开发和 PM2 部署默认使用项目根目录下的 `logs/` 目录。
  - 如使用文件记录，请使用 logrotate 轮换日志，linux 默认安装。

## 命名

- Repository 指与数据库交互的层，用来封装数据的访问逻辑，例如 `userRepository`。

## 📁 项目目录结构

```text
src/
├── models/                      # 数据库相关
│   ├── schema/              # Drizzle 声明的模式，如果表比较多可拆分多文件
│   ├── types.ts             # 定义 db 相关的类型文件
│   └── schema.ts            # Drizzle 声明的模式，最常见方法是将所有表放入一个文件中

├── config/                  # 所有配置文件
│   ├── app.ts               # 应用配置
│   ├── chain.ts             # 链相关地址和常量
│   └── reward.ts            # VIP 等级、奖励比例

├── plugins/                 # Plugins Folder。fastify 核心思想，一切皆插件
│   ├── app/                 # 内部插件：计划任务 xxx-repository、xxx-service 等
│   └── external/            # 外部的、第三方插件、例如 cors、env、数据库等

├── routes/                  # 路由（controller），service 和 model 放到 repository 中
│   ├── api/                 # api 实现
│   └── home.ts              # 根路由

├── schemas/                 # Fastify 的验证 / 序列化 schema
│   └── users.ts             # 定义 users schema

├── utils/                   # 通用工具类，不依赖 fastify 实例
│   ├── common.ts            # 通用工具函数
│   ├── format.ts            # 日期/金额、钱包地址等所有格式化工具类
│   ├── validate.ts          # 所有验证工具类
│   ├── time.ts              # dayjs 封装
│   ├── result.ts            # neverthrow 封装
│   └── web3.ts              # Alchemy、Viem 操作封装

├── app.ts                   # 应用入口文件
```

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
- 将依赖升级到最新版本 pnpm up -L axios

### 数据库操作

```bash
# 1. 创建数据库
pnpm run db:create

# 2. 初始化表结构（执行 000-init.sql）
pnpm run db:init

# 3. 运行数据库迁移（执行所有未执行的 SQL 文件）
pnpm run db:migrate

# 4. 插入种子数据
pnpm run db:seed
```

**数据库迁移说明：**

- 迁移文件位于 `sql/` 目录，命名格式：`<三位数编号>-<语义化文件名>.sql`
- 迁移按文件名顺序执行（000、001、002...）
- 系统会自动追踪已执行的迁移，避免重复执行
- 需要在 `.env` 文件中设置相应的环境变量（`CAN_MIGRATE_DATABASE=1`）才能运行迁移

**迁移文件示例：**

```
sql/
├── 000-init.sql                    # 初始化基础表
├── 001-create-posts-table.sql     # 创建文章表
├── 002-create-posts-indexes.sql   # 添加文章表索引
└── 003-posts-seed.sql              # 其他迁移...
```

## ✅ Todo List

- [ ] husky
- [ ] 添加 ai 相关服务
- [ ] 认证系统，验证登陆状态
- [ ] 补充集成测试
- [ ] 使用命令行生成 zod 验证，使用 https://github.com/sinclairzx81/typebox-codegen
