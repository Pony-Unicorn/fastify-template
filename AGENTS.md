# Developer & Agent Guidelines

本文件定义了本项目的核心技术规范和架构约束，旨在为开发者和 AI Agent 提供明确的编码准则。

## 核心技术栈
- **框架**: Fastify (TypeScript)
- **校验**: TypeBox (@fastify/type-provider-typebox)
- **ORM**: Drizzle ORM (MySQL)
- **错误处理**: `@fastify/sensible` + `neverthrow` (Result 模式)
- **测试**: Node.js built-in test runner (`node --test`)

## 编码规范

### 通用准则
- **异步处理**: 必须使用 `async/await`。
- **模块规范**: 项目使用 ESM。在导入本地文件时，**必须包含 `.js` 扩展名** (例如 `import { usersTable } from '../models/schema.js'`)。
- **类型安全**: 必须定义完整的 TypeBox Schema 进行请求验证和响应序列化。
- **命名规范**:
    - 路由文件/目录: `kebab-case` (例如 `/portfolio-tracker`)。
    - Repository 命名: 以 `Repository` 结尾 (例如 `usersRepository`)。
    - SQL 文件: `<三位数编号>-<语义化文件名>.sql` (例如 `001-create-posts-table.sql`)。

### 架构模式 (Repository 模式)
- **Repository**: 封装所有数据库访问逻辑，位于 `src/plugins/app/`。必须包含 Fastify 类型增强。
- **Plugins**: 
    - `plugins/external/`: 第三方插件配置（CORS, Rate Limit, DB 连接等）。
    - `plugins/app/`: 内部业务逻辑、Repository、Service。
- **Routes**: 位于 `src/routes/`，负责请求分发，逻辑应调用 Repository。

## 📁 项目目录结构与任务映射

AI Agent 在执行任务时应遵循以下路径映射：

| 任务类型 | 涉及目录/文件 | 职责说明 |
| :--- | :--- | :--- |
| **定义数据库表** | `src/models/schema.ts` | 使用 Drizzle ORM 定义 Table 结构 |
| **数据库类型定义** | `src/models/types.ts` | 导出 InferSelectModel/InferInsertModel 等类型 |
| **定义验证 Schema** | `src/schemas/` | 使用 TypeBox 定义请求(Body/Query)和响应格式 |
| **实现数据访问** | `src/plugins/app/` | 创建 `*-repository.ts`，封装 SQL 操作并装饰到 fastify 实例 |
| **开发 API 接口** | `src/routes/api/` | 实现 Controller 逻辑，调用 Repository，应用 Schema |
| **编写测试用例** | `test/` | 使用 Node.js 原生测试框架编写单元/集成测试 |
| **通用逻辑提取** | `src/utils/` | 编写与框架无关的纯工具函数 |
| **配置环境变量** | `.env.example` | 声明所需的变量，Agent 应参考此文件 |

## 验证 Schema 最佳实践

### 1. 强制完整性
- **请求验证**: 必须定义 `body`、`querystring` 或 `params`。
- **响应序列化**: 必须定义 `response` (至少定义 200/201)。

### 2. 命名与导出
```typescript
// src/schemas/users.ts
export const UserSchema = Type.Object({ ... })
export type User = Static<typeof UserSchema>
```

## Repository 实现模板

创建新 Repository 时必须遵循以下模式：

```typescript
// src/plugins/app/items/items-repository.ts
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { toResult } from '../../../utils/result.js'

declare module 'fastify' {
  interface FastifyInstance {
    itemsRepository: ReturnType<typeof createItemsRepository>
  }
}

export function createItemsRepository(fastify: FastifyInstance) {
  const db = fastify.db
  return {
    async findById(id: number) {
      return toResult(db.select().from(itemsTable).where(eq(itemsTable.id, id)).then(r => r[0]))
    }
  }
}

export default fp(async (fastify) => {
  fastify.decorate('itemsRepository', createItemsRepository(fastify))
}, { name: 'items-repository', dependencies: ['db'] })
```

## 错误处理与 Result 模式

- **Repository 层**: 所有异步操作必须用 `toResult` 包装，返回 `ResultAsync<T, Error>`。
- **Route 层**: 
  1. 检查 `result.isErr()`。
  2. 若报错，记录日志 `fastify.log.error` 并返回 `reply.internalServerError()` 或具体的错误。
  3. 若成功，直接解构 `result.value`。

## 测试规范
- 测试文件命名: `test/**/*.test.ts`。
- 运行测试: `npm test`。
- 模拟请求: 使用 `fastify.inject()`。

## API 设计规范 (RESTful)
- **成功响应**: 直接返回数据对象。
- **错误响应**: 使用 `reply.xxx()`，格式为 `{ "message": "..." }`。
- **状态码**: 遵循标准 (200 OK, 201 Created, 400 Bad Request, 404 Not Found 等)。