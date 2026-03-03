# Developer & Agent Guidelines (LLM-Friendly)

> 本文件的核心作用：约束 AI 在本仓库中稳定做对事。
> 目标：`边界约束 + 实现标准 + 执行流程 + 交付一致性`。

## 指令优先级
- `用户明确需求` > `安全与正确性` > `本文件规范`
- 若冲突：先说明冲突点，再执行高优先级指令

## 禁止事项（硬约束）
- 禁止使用 CommonJS（`require` / `module.exports`），仅允许 ESM
- 禁止在 Route 层直接访问 `fastify.kysely`，必须通过 Repository
- 禁止在 Repository 中 `throw`；异步必须使用 `toResult(...)` 返回 `ResultAsync`
- 禁止在 `app.ts` 手动注册插件或路由（使用 autoload）
- 禁止在 `src/schemas/` 导入数据库模型
- 禁止重复定义 `src/schemas/common.ts` 已有基础 Schema
- 禁止在应用代码直接读取 `process.env`（必须通过 `fastify.config`）
- 禁止主动执行数据库生命周期命令（`pnpm run db:*`），除非用户明确要求

## 技术栈与目录约定
- 框架：Fastify + TypeScript
- 入口：`src/server.ts`（`close-with-grace` 优雅退出）；`src/app.ts` 注册插件和路由
- 校验：TypeBox（`@fastify/type-provider-typebox`）
- ORM / Query Builder：Kysely（SQLite / better-sqlite3）
- DB 类型：`kysely-codegen` 自动生成，import 路径 `from 'kysely-codegen'`
- Schema 管理：`sql/` 目录存放原始 `.sql` 文件，通过 GUI / CLI 工具执行
- 错误处理：`@fastify/sensible` + `neverthrow`

关键目录：
- `src/server.ts`：应用入口，创建 Fastify 实例、监听端口
- `src/app.ts`：插件 / 路由 autoload，错误处理器
- `src/routes/api/`：路由层（只做请求编排）
- `src/plugins/app/`：Repository / 业务插件
- `src/plugins/external/`：第三方插件（kysely/env/cors 等）
- `src/schemas/`：请求/响应 Schema
- `sql/`：数据库表结构 SQL 文件（唯一 Schema 来源）
- `scripts/`：`create-database.ts`、`seed-database.ts`
- `test/`：测试

## 实现标准

### 1) 通用
- 本地导入必须带 `.js` 扩展名
- 实现前必须先检索仓库现有实现；新增文件必须在回复中标明"新建 + 理由"

### 2) Repository
- 删除使用软删除：`.set({ is_deleted: 1 })`

### 3) Route
- `reply.xxx()` 错误提示保持简短（如 `'Authentication required'`、`'Not found'`），不要写长句
- 输入存在时，必须声明 `body` / `querystring` / `params`

### 4) Schema
- 新建 Schema 前先复用 `src/schemas/common.ts`
- 优先复用：`MessageResponseSchema`、`PagingQueryStringSchema`、`PagingInfoSchema` 等
- 专用错误结构仅在以下任一条件为 `true` 时允许：
  - `needsFieldLevelErrors`
  - `requiresExternalProtocolAlignment`
  - `hasLegacyClientDependency`
- 若无明确需求，上述条件默认全为 `false`

## 测试规范

- 框架：`node:test` + `node:assert`，禁止引入 Jest / Vitest 等外部库
- 目录：`test/routes/` 路由集成测试、`test/plugins/` 插件单元测试、`test/app/` 应用行为测试
- 参考骨架：`test/helper.ts`（build）、`test/routes/auth.test.ts`（路由）、`test/plugins/scrypt.test.ts`（插件）

### App 实例
- 路由 / 应用级测试：用 `build(t)`（已封装 ready + close）
- 插件单元测试：裸 `Fastify({ logger: false })` 只注册被测插件，手动 `t.after(() => app.close())`
- 每个 `it` 独立创建 app，禁止跨用例共享实例

### 请求与认证
- 所有请求用 `app.inject()`，禁止真实 HTTP
- 需登录的用例用 `app.injectWithLogin(email, opts)`
- 种子用户：`basic@example.com` / `moderator@example.com` / `admin@example.com`，密码统一 `Password123$`
- 会修改状态的用例（如改密码）须先注册 `test_${Date.now()}@example.com` 独立用户，勿污染种子用户

### 密码格式
- 合法密码：`Password123$`（大写 + 小写 + 数字 + 特殊字符，8–32 位）
- "错误密码"场景须用格式合法但值错误的密码：`WrongPassword1!`，不能用 `wrong`

### 分组与断言
- 路由测试：`describe('METHOD /api/path', ...)` 分组，case 名描述预期行为
- 单一职责的应用行为：直接顶层 `it`，不嵌套 `describe`
- 断言：状态码用 `strictEqual`，结构用 `deepStrictEqual`，布尔用 `ok`；400 校验错误用 `expectValidationError(res, message)`
- 修改 env 的用例：先 `t.after()` 注册还原，再 `build(t)`

## 执行流程（代码/配置改动必做）
1. 检索定位：查找现有实现与类型定义
2. 参考同类：至少阅读 1 个同类文件（Route/Repository 改动需对应参考）
3. 实施修改：只改与当前任务直接相关内容
4. 执行验证：
   - 改 `src/` 或 `test/` 的 TS 代码：必须执行 `pnpm run build`
   - 涉及业务逻辑/Route/Repository 行为改动：必须执行 `pnpm test`
   - 改构建或配置契约（如 `package.json` / `tsconfig*` / `.env.example`）：至少执行 `pnpm run build`，必要时 `pnpm test`
5. 结构化回复：按"交付格式"输出

## 常用命令（AI 可执行）
- `pnpm run dev`
- `pnpm run build`
- `pnpm test`
- `pnpm run lint` / `pnpm run lint:fix`
- `pnpm run format` / `pnpm run format-fix`

## 交付格式（实施改动时必须）
```text
变更文件:
- <path>

参考文件:
- <path>

验证状态:
- <build/test 执行结果>
- <若失败: 失败命令 + 核心报错>

未完成项或风险:
- <无 / 具体项>
```

若使用专用错误结构，额外输出：
```text
exception=true, reason=<needsFieldLevelErrors|requiresExternalProtocolAlignment|hasLegacyClientDependency>
```

## 最小模板（骨架）

### Repository 骨架
```typescript
import fp from 'fastify-plugin'
import { sql } from 'kysely'
import { toResult } from '../../../utils/result.js'

export function createXxxRepository(fastify) {
  const db = fastify.kysely
  return {
    findById(id: number) {
      return toResult(
        db.selectFrom('xxx')
          .selectAll()
          .where('id', '=', id)
          .where('is_deleted', '=', 0)
          .executeTakeFirst()
      )
    },
    updateById(id: number, data: { name: string }) {
      return toResult(
        db.updateTable('xxx')
          .set({
            name: data.name,
            updated_at: sql<number>`unixepoch()`,
            version: sql<number>`version + 1`
          })
          .where('id', '=', id)
          .where('is_deleted', '=', 0)
          .execute()
      )
    }
  }
}

export default fp(async (fastify) => {
  fastify.decorate('xxxRepository', createXxxRepository(fastify))
}, { name: 'xxx-repository', dependencies: ['kysely'] })
```

### Route 骨架
```typescript
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { MessageResponseSchema } from '../../../schemas/common.js'
import { EntityIdParamsSchema, EntityResponseSchema } from '../../../schemas/xxx.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { xxxRepository, log } = fastify

  fastify.get('/:id', {
    schema: {
      params: EntityIdParamsSchema,
      response: {
        200: EntityResponseSchema,
        404: MessageResponseSchema,
        500: MessageResponseSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    const result = await xxxRepository.findById(id)

    if (result.isErr()) {
      log.error(`Failed to fetch entity: ${result.error.message}`)
      return reply.internalServerError('Internal Server Error')
    }

    return result.value ?? reply.notFound('Not found')
  })
}

export default plugin
```
