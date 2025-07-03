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
# 克隆项目
git clone https://github.com/Pony-Unicorn/fastify-template.git my-project
cd my-project

# 安装依赖（推荐使用 pnpm）
pnpm i

# 启动开发模式
pnpm dev
```

## 📐 规范

- 所有提交前将自动执行 lint 和格式化检查。
- 使用 TypeBox + @fastify/type-provider-typebox 来统一类型和验证。
- 所有 SQL 构建使用 drizzle-orm，避免手写 SQL 字符串。
- 认证采用 `Authorization: <type> <credentials>` 方式
  - Bearer、tma、personal_sign
- reply(响应):
  - 简单化：查询：读操作强烈建议使用 get 请求。更新、创建、删除：写操作强烈建议使用 post 请求
  - 尽量实现 restfulApi 标准，返回格式 {statusCode,message,result}
  - 尽量使用 Async Await 形式
  - 返回响应
    - 常规接口直接用 return { statusCode: 200, message: 'OK', result: data } 这种纯对象返回
    - 特殊需求（比如非200状态码或者特殊头部）时，才用 reply.status(code).send() 方式手动控制响应
- schema: 尽量写好 schema, 使用 @sinclair/typebox 库
- routes:
  - 路由目录，一个文件为一个模块
  - controller 耦合到 route 中，service 耦合到 plugins 中
- log 日志
  - 如果使用文件记录，使用 logrotate 轮换日志，大部分系统默认安装
  - 推荐线上程序日志路径 /var/log/app-name.log
- 配置文件和常量统一放到 config 目录

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

## ✅ Todo List

- [ ] husky
- [ ] test 测试
