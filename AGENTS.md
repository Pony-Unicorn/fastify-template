# Developer & Agent Guidelines (LLM-Friendly)

> AI Agent 在生成、修改、审查本目录下的任何代码前，必须遵守以下全部规则。

## 指令优先级与冲突处理
- `用户明确需求` > `安全与正确性约束` > `本文件风格约束`。
- 若发生冲突，Agent 必须先简要说明冲突点，再执行优先级更高的指令。

## 核心技术栈
- **框架**: Fastify (TypeScript)
- **校验**: TypeBox (@fastify/type-provider-typebox)
- **ORM**: Drizzle ORM (MySQL)
- **错误处理**: `@fastify/sensible` + `neverthrow` (Result 模式)
- **测试**: 统一通过 `npm test` 执行（底层为 `c8 + node --test + tsx`）。

## 禁止事项
- **不要**使用 CommonJS（`require` / `module.exports`），项目是 ESM
- **不要**在 Route 层直接访问 `fastify.db`，必须通过 Repository
- **不要**在 Repository 中 `throw` 异常；异步操作必须用 `toResult` 包装返回 `ResultAsync`，同步组合已有结果时可直接使用 `ok()` / `err()` 返回 `Result`
- **不要**手动在 `app.ts` 中 `register` 插件或路由，依赖 autoload 自动注册
- **不要**在 `src/schemas/` 中导入数据库模型（保持 Schema 层与 ORM 解耦）
- **不要**重复定义 `src/schemas/common.ts` 中已有的基础 Schema
- **不要**在应用代码中直接使用 `process.env`，必须通过 `fastify.config` 访问

## 项目目录结构与任务映射

AI Agent 在执行任务时应遵循以下路径映射：

| 任务类型 | 涉及目录/文件 | 职责说明 |
| :--- | :--- | :--- |
| **应用入口** | `src/app.ts` | AutoLoad 注册、全局错误处理、404 处理 |
| **应用配置** | `src/config/` | 应用级配置（版本号等） |
| **环境变量** | `.env.example`, `src/plugins/external/env.ts` | `.env.example` 声明变量；`env.ts` 定义校验 Schema 并注入到 `fastify.config` |
| **定义数据库表** | `src/models/schema.ts` | 使用 Drizzle ORM 定义 Table 结构 |
| **数据库公共列** | `src/models/columns.helpers.ts` | 提供 `timestamps`、`softDeletes`、`versioning` 等可展开的公共列定义 |
| **数据库辅助类型** | `src/models/types.ts` | 导出 ORM 辅助类型（如 `MySqlDBTransaction` 事务类型） |
| **定义验证 Schema** | `src/schemas/` | 使用 TypeBox 定义请求/响应 Schema，`common.ts` 存放可复用基础定义 |
| **实现数据访问** | `src/plugins/app/` | 创建 `*-repository.ts`，封装 SQL 操作并装饰到 fastify 实例 |
| **业务插件** | `src/plugins/app/` | 非 Repository 类插件（如 `password-manager.ts`） |
| **第三方插件配置** | `src/plugins/external/` | CORS、Helmet、Rate Limit、DB 连接、环境变量等 |
| **开发 API 接口** | `src/routes/api/` | 实现路由逻辑，调用 Repository，应用 Schema |
| **路由钩子** | `src/routes/api/autohooks.ts` | autoload 自动应用的路由前置钩子（如鉴权） |
| **编写测试用例** | `test/` | 使用 Node.js 原生测试框架编写单元/集成测试 |
| **测试辅助** | `test/helper.ts` | 提供 `build(t)` 构建测试实例、`expectValidationError()` 等辅助函数 |
| **通用逻辑提取** | `src/utils/` | 编写与框架无关的纯工具函数 |
| **数据库脚本** | `scripts/` | 数据库创建、初始化、迁移、种子数据脚本 |

## 编码规范

### 通用准则
- **异步处理**: 除 Repository 中直接返回 `ResultAsync` 的方法外，统一使用 `async/await`。
- **模块规范**: 项目使用 ESM。在导入本地文件时，**必须包含 `.js` 扩展名** (例如 `import { usersTable } from '../models/schema.js'`)。
- **类型安全**: 必须定义完整的 TypeBox Schema 进行请求验证和响应序列化。
- **TypeBox 导入**:
    - Schema 定义统一使用: `import { Type, Static } from '@sinclair/typebox'`
    - Route 类型统一使用: `import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'`
- **环境变量访问**: 运行时环境变量通过 `fastify.config` 访问（由 `@fastify/env` 注入）。变量定义与校验规则以 `src/plugins/external/env.ts` 为唯一权威来源（新增变量的联动修改见「跨文件一致性」）。
- **防止幻觉**: 实现前必须先检索现有代码、类型与插件装饰。若需要新增文件/能力，必须在回复中明确说明"新建"及理由。
- **执行流程（代码/配置变更任务必做）**:
    - 按 `检索定位 -> 阅读同类实现 -> 实施修改 -> 执行验证` 顺序进行。
    - 豁免: 纯文档、注释、拼写或格式化改动可跳过检索与验证，但需在回复中说明豁免理由。
    - 路由改动: 至少参考 `1` 个同类 Route 文件 + `1` 个相关 Schema 文件。
    - Repository 改动: 至少参考 `1` 个同类 Repository 文件 + `1` 个 `src/utils/result.ts` 使用点。
    - 涉及新增文件或架构决策时，应在回复中列出参考文件路径。
    - 参考文件必须来自当前仓库且真实存在，并与本次改动直接相关。
- **默认决策**: 若信息缺失会影响接口契约、数据结构或行为语义，必须先询问用户；其余场景可做最小且安全的合理假设继续执行，并在回复中明确假设。
- **命名规范**:
    - 路由文件/目录: `kebab-case` (例如 `/portfolio-tracker`)。
    - Repository 命名: 以 `Repository` 结尾 (例如 `usersRepository`)。
    - 数据库脚本: 位于 `scripts/` 目录，通过 `npm run db:*` 命令执行。

### 插件加载机制
项目使用 `@fastify/autoload` 自动注册，**不需要手动 import/register**：
1. `src/plugins/external/` — 先加载（第三方插件，如 DB、CORS、Rate Limit）
2. `src/plugins/app/` — 后加载（业务插件，依赖 external）
3. `src/routes/` — 最后加载，启用 `autoHooks: true` + `cascadeHooks: true`

- 新增插件只需在对应目录创建文件并 `export default fp(...)` 即可自动注册。
- 新增路由只需在 `src/routes/api/<feature>/index.ts` 创建文件并 `export default plugin` 即可自动注册。
- `autohooks.ts` 文件（如 `src/routes/api/autohooks.ts`）会被自动应用为该目录及子目录下所有路由的前置钩子（如鉴权）。

### 架构模式 (Repository 模式)
- **Repository**: 封装所有数据库访问逻辑，位于 `src/plugins/app/`。必须包含 Fastify 类型增强。
- **Plugins**:
    - `plugins/external/`: 第三方插件配置（CORS, Rate Limit, DB 连接等）。
    - `plugins/app/`: 内部业务逻辑、Repository、Service（如 `password-manager.ts`）。
- **Routes**: API 路由默认位于 `src/routes/api/<feature>/index.ts`，负责请求分发，逻辑应调用 Repository。

## Repository 实现模板

创建新 Repository 时必须遵循以下模式：

说明: Repository 查询统一使用 `await` 作为主风格，并通过 `toResult(...)` 返回 `ResultAsync`。

**软删除**: 项目使用软删除（`isDeleted` 字段），所有查询默认需过滤 `eq(table.isDeleted, 0)`，删除操作通过 `set({ isDeleted: 1 })` 实现而非物理删除。

**UPDATE 操作审计字段**: 所有 UPDATE 操作必须同步更新审计字段（对应 `columns.helpers.ts` 中的 `timestamps` 和 `versioning`）：
```typescript
.set({
  // ...业务字段
  updatedAt: sql`UNIX_TIMESTAMP()`,
  version: sql`version + 1`
})
```

```typescript
// src/plugins/app/items/items-repository.ts
import { and, eq, sql } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ResultAsync } from 'neverthrow'

import { itemsTable } from '../../../models/schema.js'
import { toResult } from '../../../utils/result.js'

type Item = typeof itemsTable.$inferSelect

declare module 'fastify' {
  interface FastifyInstance {
    itemsRepository: ReturnType<typeof createItemsRepository>
  }
}

export function createItemsRepository(fastify: FastifyInstance) {
  const db = fastify.db
  return {
    findById(id: number): ResultAsync<Item | null, Error> {
      const runQuery = async () => {
        const rows = await db
          .select()
          .from(itemsTable)
          .where(and(eq(itemsTable.id, id), eq(itemsTable.isDeleted, 0)))
          .limit(1)
        return rows[0] ?? null
      }

      return toResult(runQuery())
    },

    updateById(id: number, data: { name: string }) {
      return toResult(
        db
          .update(itemsTable)
          .set({
            name: data.name,
            updatedAt: sql`UNIX_TIMESTAMP()`,
            version: sql`version + 1`
          })
          .where(eq(itemsTable.id, id))
      )
    }
  }
}

export default fp(async (fastify) => {
  fastify.decorate('itemsRepository', createItemsRepository(fastify))
}, { name: 'items-repository', dependencies: ['db'] })
```

## Route 实现模板

创建新 Route 时必须遵循以下模式。使用 `FastifyPluginAsyncTypebox` 时，类型由 schema 自动推导，无需手动传泛型参数：

```typescript
// src/routes/api/items/index.ts
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

import {
  MessageResponseSchema,
  PagingQueryStringSchema
} from '../../../schemas/common.js'
import { ItemsListResponseSchema } from '../../../schemas/items.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { itemsRepository, log } = fastify

  fastify.get(
    '/',
    {
      schema: {
        querystring: PagingQueryStringSchema,
        response: {
          200: ItemsListResponseSchema,
          500: MessageResponseSchema
        }
      }
    },
    async (request, reply) => {
      const { page, page_size: pageSize } = request.query
      const result = await itemsRepository.findAll({ page, pageSize })

      if (result.isErr()) {
        log.error(`Failed to fetch items: ${result.error.message}`)
        return reply.internalServerError('Internal Server Error')
      }

      return result.value
    }
  )
}

export default plugin
```

## 错误处理与 Result 模式

- **全局错误处理器**（`src/app.ts`）: 4xx 错误返回 `{ message: err.message }`，5xx 错误统一返回 `{ message: 'Internal Server Error' }`（隐藏内部细节）。Route 层无需额外 try/catch，未捕获的异常会被全局处理器兜底。
- **Repository 层**: 所有异步操作必须用 `toResult` 包装，返回 `ResultAsync<T, Error>`；同步组合已有结果时可直接使用 `ok()` / `err()` 返回 `Result`。
- **Route 层**:
  1. 检查 `result.isErr()`。
  2. 若报错，记录日志 `fastify.log.error` 并返回 `reply.internalServerError('Internal Server Error')`，不得暴露内部细节。
  3. 若成功，直接解构 `result.value`。

## 验证 Schema 最佳实践
### 1. 强制完整性
- **请求验证**: 路由存在输入时，必须定义对应的 `body`、`querystring` 或 `params`。
- **响应序列化**: 必须定义 `response`，并按语义选择成功状态码（如 200 / 201 / 204）。
- **错误响应**:
    - 若使用 Fastify 默认错误格式: 保持默认结构，不强制 `MessageResponseSchema`。
    - 若使用自定义错误体: 必须在 `response` 中显式声明对应 4xx/5xx Schema，并优先复用 `src/schemas/common.ts` 的 `MessageResponseSchema`（不满足时再新增专用错误 Schema）。

### 2. 复用原则
编写新 Schema 前，**必须先检查** `src/schemas/common.ts` 中已有的基础定义：
- `EmailSchema` / `StringSchema` / `IdSchema` / `DateTimeSchema` — 常用字段类型
- `MessageResponseSchema` — 通用消息响应 `{ message: string }`
- `PagingQueryStringSchema` — 分页查询参数（querystring 用 `snake_case`：`page`, `page_size`）
- `PagingInfoSchema` — 分页响应信息（response 用 `camelCase`：`page`, `pageSize`, `total`）
- `HeaderAuthSchema` — Authorization 请求头

### 3. 命名与导出
```typescript
// src/schemas/<module>.ts
import { Type, Static } from '@sinclair/typebox'
export const UserSchema = Type.Object({ ... })
export type User = Static<typeof UserSchema>
```

## 测试规范
- `npm test` 实际执行范围为 `test/**/*.ts`（以 `package.json` scripts 为准）。
- 测试文件建议命名: `test/**/*.test.ts`。
- 测试辅助函数位于 `test/helper.ts`，提供 `build(t)` 构建测试实例（自动在测试结束后关闭）和 `expectValidationError()` 断言辅助。
- **环境变量清理**: 测试中若修改 `process.env`，**必须**在修改前保存原值，并在 `t.after()` 中恢复，防止泄漏到其他测试用例：
  ```typescript
  const original = process.env.SOME_VAR
  process.env.SOME_VAR = 'test-value'
  t.after(() => {
    process.env.SOME_VAR = original
  })
  ```
- 标准测试结构:
  ```typescript
  import assert from 'node:assert'
  import { describe, it } from 'node:test'
  import { build } from '../helper.js'

  describe('Feature', () => {
    it('should ...', async (t) => {
      const app = await build(t)
      const res = await app.inject({ method: 'GET', url: '/api/...' })
      assert.strictEqual(res.statusCode, 200)
    })
  })
  ```

## 执行完成标准 (Definition of Done)
- 当修改 `src/` 或 `test/` 下的 TypeScript 代码时，至少执行一次 `npm run build:ts`，确保类型检查通过。
- 涉及业务逻辑、路由或 Repository 行为改动时，至少执行一次 `npm test`。
- 当修改 `package.json`、`tsconfig*.json`、`eslint.config.*`、`prettier.config.*`、`.env.example` 等构建/依赖/配置契约时，也必须至少执行一次 `npm run build:ts`，必要时执行 `npm test`。
- 若命令失败，Agent 必须在回复中说明失败命令与原因。

## Agent 输出格式
> 仅在实施代码或配置变更时使用；纯咨询/评审类任务可简答。

- **单文件小修复**: 列出变更文件 + 验证结果即可。
- **多文件 / 架构变更**:
  - **变更文件**: 列出修改过的文件路径。
  - **参考文件**: 列出修改前参考过的具体文件路径（涉及新增文件或架构决策时必须列出）。
  - **验证状态**: 已执行或未执行的验证项（build/test）及原因。
  - **未完成项或风险**: 未执行项、失败项或潜在影响。

## 常用命令

| 命令 | 用途 |
| :--- | :--- |
| `npm run dev` | 启动开发环境（构建 + 监听） |
| `npm run build:ts` | TypeScript 编译（类型检查） |
| `npm test` | 运行全部测试（含类型检查 + 覆盖率） |
| `npm run lint` / `npm run lint:fix` | ESLint 检查 / 自动修复 |
| `npm run format` / `npm run format-fix` | Prettier 格式检查 / 自动修复 |
| `npm run db:create` | 创建数据库 |
| `npm run db:init` | 初始化表结构 |
| `npm run db:migrate` | 执行数据库迁移 |
| `npm run db:seed` | 填充种子数据 |

## 新增业务模块流程

当需要新增一个完整的 CRUD 模块时，按以下顺序创建文件：

1. `src/models/schema.ts` — 添加 Drizzle 表定义（必须展开 `columns.helpers.ts` 中的 `timestamps`, `softDeletes`, `versioning`）
2. `src/models/types.ts` — 如需新的辅助类型，在此添加
3. `src/schemas/<module>.ts` — 定义 TypeBox 请求/响应 Schema（优先复用 `common.ts`）
4. `src/plugins/app/<module>/<module>-repository.ts` — 实现 Repository（参考本文 Repository 实现模板）
5. `src/routes/api/<module>/index.ts` — 实现路由（参考本文 Route 实现模板）
6. `test/app/<module>.test.ts` — 编写测试（使用 `test/helper.ts` 的 `build(t)` 构建实例）

## API 设计规范 (RESTful)
- **成功响应**: 直接返回数据对象。
- **错误响应**: 错误体与错误 Schema 规则以"验证 Schema 最佳实践"章节为唯一权威定义；本章节仅要求使用 `reply.xxx()` 并遵循该章节规则。
- **状态码**: 遵循标准 (200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found, 500 Internal Server Error 等)。
