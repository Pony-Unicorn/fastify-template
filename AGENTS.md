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
- 禁止主动执行数据库生命周期命令（`npm run db:*`），除非用户明确要求

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

## 执行流程（代码/配置改动必做）
1. 检索定位：查找现有实现与类型定义
2. 参考同类：至少阅读 1 个同类文件（Route/Repository 改动需对应参考）
3. 实施修改：只改与当前任务直接相关内容
4. 执行验证：
   - 改 `src/` 或 `test/` 的 TS 代码：必须执行 `npm run build`
   - 涉及业务逻辑/Route/Repository 行为改动：必须执行 `npm test`
   - 改构建或配置契约（如 `package.json` / `tsconfig*` / `.env.example`）：至少执行 `npm run build`，必要时 `npm test`
5. 结构化回复：按"交付格式"输出

## 常用命令（AI 可执行）
- `npm run dev`
- `npm run build`
- `npm test`
- `npm run lint` / `npm run lint:fix`
- `npm run format` / `npm run format-fix`

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
