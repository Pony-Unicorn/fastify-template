# Fastify template

一个基于 [Fastify](https://fastify.dev) 的现代 TypeScript 后端开发模板，内置多种常用插件和开发工具，支持模块化、类型安全、编程式 SQL 构建（基于 Drizzle ORM）及严格的代码风格校验。

## ✨ 特性

- ⚡ 极速的 Fastify 框架
- 🧱 TypeBox 类型推导 + 校验一体化
- 🔐 Helmet + CORS + Rate Limit 安全方案
- 📊 Drizzle ORM + MySQL 支持
- 🔌 插件自动加载机制
- 🌲 日志和错误友好处理（`@fastify/sensible`）
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

## 📐 规范

- 提交前执行 lint 或 format 进行代码格式化
- 使用 TypeBox + @fastify/type-provider-typebox 来统一类型和验证。
- SQL 构建器使用 drizzle-orm 框架，避免手写 SQL 语句。
- API 接口设计遵循 RESTful API 标准
  - 参考[RESTful API 设计参考文献列表](https://github.com/aisuhua/restful-api-design-references)
  - 参考[good API design](https://www.seangoedecke.com/good-api-design/)
- 认证采用 `Authorization: <type> <credentials>` 方式
  - Bearer、tma、personal_sign
- reply(响应):
  - 尽量使用 async/await 形式
  - 返回响应
    - 常规接口直接用 return { statusCode: 200, message: 'OK', result: data } 这种纯对象返回
    - 特殊需求（比如非200/201状态码或特殊 header）时，使用 reply.status(code).send() 手动控制响应
- 状态码
  - 参考 https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Status
  - 常见的 HTTP 状态码, 使用 https://github.com/prettymuchbryce/http-status-codes

    > 只有来自客户端的请求被正确的处理后才能返回 2xx 的响应，所以当 API 返回 2xx 类型的状态码时，前端必须认定该请求已处理成功。

  - 必须强调的是，所有 API 一定不可返回 1xx 类型的状态码。当 API 发生错误时，必须返回错误的详细信息。
  - 状态码规则
    - 使用 HTTP 状态码 + 三位业务码 格式，如 403002 代表用户已禁用, 也可简化处理不加业务码
    - 200 最常见的状态码，在所有成功的 GET 请求中，必须返回此状态码
    - 201 当服务器创建数据成功时，返回此状态码。常见的场景是使用 POST 提交用户信息，如：添加了新用户、上传了图片、创建了新活动等，也可以选择在用户创建成功后返回新用户的数据
  - 判断标准：看你的controller方法能不能正常执行完
    - ✅ 200的情况：
      - 查到用户了 → return user
      - 没查到用户 → return null 或 { users: [] }
      - 转账余额不足 → return { success: false, msg: '余额不足' }
    - ❌ 4xx/5xx的情况：
      - 参数格式错误 → 还没开始查就发现问题 → 400
      - 没登录 → 压根不让你查 → 401
      - 数据库连不上 → 查询执行失败 → 500
  - 总结
    - 参数格式错误 → HTTP 400 + 自定义错误码
    - 认证失败 → HTTP 401 + 自定义错误码
    - 资源不存在 → HTTP 404 + 自定义错误码
    - 业务逻辑失败 → HTTP 200 + 自定义错误码

- schema: 尽量写好 schema, 使用 @sinclair/typebox 库
- routes:
  - 路由目录，一个文件为一个模块
  - controller 耦合到 route 中，service 耦合到 plugins 中
  - 命名方式为 kebab-case，示例 /portfolio-tracker，可读性高、SEO 友好、Web 标准
- 配置文件和常量统一放到 config 目录
- sql 数据库文件，<编号>-<模块>-<内容类型>.sql
  - 001-schema.sql
  - 002-post-schema.sql
  - 003-post-seed.sql
  - 004-post-indexes.sql
- log 日志
  - 如果使用文件记录，使用 logrotate 轮换日志，大部分系统默认安装
  - 推荐线上程序日志路径 /var/log/app-name.log

## 📁 项目目录结构

```text
src/
├── db/                      # 数据库相关
│   ├── schema/              # Drizzle 声明的模式，如果表比较多可拆分多文件
│   ├── types.ts             # 定义 db 相关的类型文件
│   └── schema.ts            # Drizzle 声明的模式，最常见方法是将所有表放入一个文件中

├── config/                  # 所有配置文件
│   ├── app.ts               # 应用配置
│   ├── chain.ts             # 链相关地址和常量
│   └── reward.ts            # VIP 等级、奖励比例

├── plugins/                 # Plugins Folder。fastify 核心思想，一切皆插件
│   ├── app/                 # 应用内部自封装的插件，包括数据库 xxx-repository、xxx-service等
│   ├── external/            # 外部的、第三方插件、例如 cors、env、数据库等
│   └── other/               # 其他插件

├── routes/                  # 所有路由，尽量简化 controller、service、model
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

| 包名                                                                   | 说明                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| [`@fastify/auth`](https://github.com/fastify/fastify-auth)             | 多重认证策略支持，可组合多个鉴权方案              |
| [`@fastify/jwt`](https://github.com/fastify/fastify-jwt)               | JWT 签发与验证插件，适合构建登录系统或 API 鉴权   |
| [`@fastify/cookie`](https://github.com/fastify/fastify-cookie)         | 用于处理 HTTP Cookie，配合认证或 session 常用     |
| [`@fastify/session`](https://github.com/fastify/session)               | 基于 Cookie 的会话管理插件                        |
| [`@fastify/multipart`](https://github.com/fastify/fastify-multipart)   | 支持文件上传，支持多文件、流式传输                |
| [`@fastify/static`](https://github.com/fastify/fastify-static)         | 静态文件服务，适合部署前端资源或文件下载          |
| [`@fastify/swagger`](https://github.com/fastify/fastify-swagger)       | 自动生成 OpenAPI 规范的 API 文档                  |
| [`@fastify/swagger-ui`](https://github.com/fastify/fastify-swagger-ui) | 配合 `@fastify/swagger` 展示 Swagger UI 界面      |
| [`csv-stringify`](https://csv.js.org/stringify/)                       | 将数据导出为 CSV 格式，适用于报表、数据导出等场景 |

> 这些依赖尚未包含在项目中，可根据实际需求通过 `pnpm add 包名` 安装使用。

## 安全防护

- 尽量使用 cloudflare 代理流量，并且在云服务提供商设置防火墙只允许 cf ip 访问
  - cloudflare ips https://www.cloudflare.com/zh-cn/ips/

## 常用命令

- 查看当前有哪些包已过时 pnpm outdated
- 升级到 semver 范围内的最新版本 pnpm up
- 将依赖升级到最新版本 pnpm up -L axios

## ✅ Todo List

- [ ] husky
- [ ] test 测试
- [ ] 使用命令行生成 zod 验证，使用 https://github.com/sinclairzx81/typebox-codegen
