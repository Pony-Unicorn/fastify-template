# Developer & Agent Guidelines (LLM-Friendly)

> 本文件的核心作用：约束 AI 在本仓库中稳定做对事。  
> 目标：`边界约束 + 实现标准 + 执行流程 + 交付一致性`。

## 指令优先级
- `用户明确需求` > `安全与正确性` > `本文件规范`
- 若冲突：先说明冲突点，再执行高优先级指令

## 禁止事项（硬约束）
- 禁止使用 CommonJS（`require` / `module.exports`），仅允许 ESM
- 禁止在 Route 层直接访问 `fastify.db`，必须通过 Repository
- 禁止在 Repository 中 `throw`；异步必须使用 `toResult(...)` 返回 `ResultAsync`
- 禁止在 `app.ts` 手动注册插件或路由（使用 autoload）
- 禁止在 `src/schemas/` 导入数据库模型
- 禁止重复定义 `src/schemas/common.ts` 已有基础 Schema
- 禁止在应用代码直接读取 `process.env`（必须通过 `fastify.config`）
- 禁止主动执行数据库生命周期命令（`npm run db:*`），除非用户明确要求

## 技术栈与目录约定
- 框架：Fastify + TypeScript
- 校验：TypeBox（`@fastify/type-provider-typebox`）
- ORM：Drizzle ORM（MySQL）
- 错误处理：`@fastify/sensible` + `neverthrow`

关键目录：
- `src/routes/api/`：路由层（只做请求编排）
- `src/plugins/app/`：Repository / 业务插件
- `src/plugins/external/`：第三方插件（db/env/cors 等）
- `src/schemas/`：请求/响应 Schema
- `src/models/`：数据库结构与类型
- `test/`：测试

## 实现标准

### 1) 通用
- 本地导入必须带 `.js` 扩展名
- 实现前必须先检索仓库现有实现；新增文件必须在回复中标明“新建 + 理由”

### 2) Repository
- 所有异步数据库操作必须 `toResult(...)`
- 查询默认过滤软删除：`eq(table.isDeleted, 0)`
- 删除使用软删除：`set({ isDeleted: 1 })`
- UPDATE 必须同步更新审计字段：
```typescript
updatedAt: sql`UNIX_TIMESTAMP()`,
version: sql`version + 1`
```
- 插件注册需 `fastify.decorate('<name>Repository', ...)` 且 `dependencies: ['db']`

### 3) Route
- 使用 `FastifyPluginAsyncTypebox`
- 输入存在时，必须声明 `body` / `querystring` / `params`
- 必须声明 `response`（成功 + 错误）
- 默认错误响应使用 `MessageResponseSchema`
- 调用 Repository 后必须判断 `result.isErr()`，错误分支统一：
  - `fastify.log.error(...)`
  - `reply.internalServerError('Internal Server Error')`

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
   - 改 `src/` 或 `test/` 的 TS 代码：必须执行 `npm run build:ts`
   - 涉及业务逻辑/Route/Repository 行为改动：必须执行 `npm test`
   - 改构建或配置契约（如 `package.json` / `tsconfig*` / `.env.example`）：至少执行 `npm run build:ts`，必要时 `npm test`
5. 结构化回复：按“交付格式”输出

## 常用命令（AI 可执行）
- `npm run dev`
- `npm run build:ts`
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
import { and, eq, sql } from 'drizzle-orm'
import fp from 'fastify-plugin'
import { toResult } from '../../../utils/result.js'

export function createXxxRepository(fastify) {
  const db = fastify.db
  return {
    findById(id: number) {
      return toResult(
        db.select().from(xxxTable).where(and(eq(xxxTable.id, id), eq(xxxTable.isDeleted, 0))).limit(1)
      )
    },
    updateById(id: number, data: { name: string }) {
      return toResult(
        db.update(xxxTable).set({
          name: data.name,
          updatedAt: sql`UNIX_TIMESTAMP()`,
          version: sql`version + 1`
        }).where(and(eq(xxxTable.id, id), eq(xxxTable.isDeleted, 0)))
      )
    }
  }
}

export default fp(async (fastify) => {
  fastify.decorate('xxxRepository', createXxxRepository(fastify))
}, { name: 'xxx-repository', dependencies: ['db'] })
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
