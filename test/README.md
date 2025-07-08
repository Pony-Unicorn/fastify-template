# 测试说明

## 运行测试

```bash
# 完整测试（编译 + 测试 + 覆盖率）
pnpm test

# 快速开发测试（仅测试 + 覆盖率，无需编译）
pnpm run test:dev

# 监视模式测试
pnpm run test:watch
```

## 技术栈

- **测试框架**: Node.js 内置 `node:test`
- **TypeScript 运行时**: `tsx` (无需预编译)
- **覆盖率**: `c8`
- **断言库**: Node.js 内置 `node:assert`

## 测试结构

```
test/
├── app/                    # 应用功能测试
│   ├── api-routes.test.ts  # API 路由测试
│   ├── cors.test.ts        # CORS 测试
│   ├── error-handler.test.ts # 错误处理测试
│   ├── not-found-handler.test.ts # 404 处理测试
│   ├── rate-limit.test.ts  # 速率限制测试
│   └── security.test.ts    # 安全功能测试
├── plugins/                # 插件测试
│   ├── helmet.test.ts      # Helmet 安全插件测试
│   └── scrypt.test.ts      # 密码管理插件测试
├── utils/                  # 工具函数测试
│   └── response.test.ts    # 响应工具测试
├── helper.ts              # 测试辅助函数
└── README.md              # 测试文档
```

## 覆盖率报告

测试运行后会生成覆盖率报告，当前覆盖率：**84.24%**

## 注意事项

- 测试直接使用 `tsx` 运行 TypeScript 文件，无需编译
- 测试依赖编译后的源代码（因为 `@fastify/autoload` 需要）
- 编译生成的测试 `.js` 文件已被 `.gitignore` 忽略