# 项目结构与技术架构

> 基于 2026-10-28 的实际目录、配置和源码整理。目录或架构变更后同步更新本文件；具体依赖版本以各包的 `package.json` 和根目录 `pnpm-lock.yaml` 为准。

## 项目概况

`zyk-admin-ai` 基于 Better-T-Stack 创建，采用 **pnpm Workspace + Turborepo + TypeScript** 管理 Monorepo。当前有四个应用和五个共享包，整体为前后端分离架构：Web 与移动端共享 API 类型，独立 Hono 服务负责接口和认证，PostgreSQL 存储数据，另有独立的 Fumadocs 文档站。

当前处于基础骨架阶段：已实现邮箱密码注册/登录、会话读取、受保护页面及接口、API 健康检查、主题切换和移动端导航示例。项目名称中的 `admin-ai` 不代表已具备后台权限系统或 AI 服务；目前未发现角色权限、菜单管理、租户模型、模型调用、RAG 或 Agent 业务实现。

## 目录结构

使用以下 `tree` 命令检查实际结构；下方是补充职责说明后的主要目录，省略重复配置和组件明细：

```bash
tree -a -L 4 --noreport -I 'node_modules|.git|.next|.turbo|dist|build|.expo|.DS_Store|.vercel|.cache|.source|generated|*.tsbuildinfo|.env|.env.local|.env.*.local|.env.production|.env.development|.agents|.claude|.cursor|.codex|.vscode'
tree -L 5 --noreport apps/web/src apps/native/app apps/fumadocs/src/app packages/db/prisma
```

```text
zyk-admin-ai/
├── apps/
│   ├── web/                           # Next.js Web 应用，开发端口 3001
│   │   ├── src/
│   │   │   ├── app/                   # App Router 路由及布局
│   │   │   │   ├── layout.tsx         # 根布局、字体、Header、Providers
│   │   │   │   ├── page.tsx           # 首页，显示 API 连通状态
│   │   │   │   ├── login/page.tsx     # 登录与注册表单切换
│   │   │   │   └── dashboard/
│   │   │   │       ├── page.tsx       # 服务端读取会话，未登录跳转 /login
│   │   │   │       └── dashboard.tsx  # 客户端请求受保护接口
│   │   │   ├── components/            # Web 专属组件、表单、主题及 Provider
│   │   │   ├── lib/auth-client.ts     # Better Auth Web 客户端
│   │   │   ├── utils/trpc.ts          # tRPC 客户端、React Query 缓存及上下文
│   │   │   ├── index.css              # 引入共享 UI 全局样式
│   │   │   └── env.ts                 # Varlock 生成，勿手改
│   │   ├── .env.schema                # Web 环境变量声明
│   │   ├── components.json            # shadcn 配置，UI 别名指向 packages/ui
│   │   ├── next.config.ts             # Varlock、typedRoutes、React Compiler
│   │   └── AGENTS.md                  # Next.js 子目录补充规则
│   ├── server/                        # Hono API 服务，端口 3000
│   │   ├── src/
│   │   │   ├── index.ts               # HTTP 入口、日志/CORS、认证与 tRPC 路由
│   │   │   ├── services.ts            # 创建并共享 db、auth 实例
│   │   │   ├── context.ts             # 从请求头读取会话，构建 API Context
│   │   │   ├── env.server.ts          # 加载 Varlock 后导出 ENV
│   │   │   └── env.ts                 # Varlock 生成
│   │   ├── .env.schema                # 服务端环境变量声明
│   │   └── tsdown.config.ts           # ESM 构建，打包内部 workspace 依赖
│   ├── native/                        # Expo / React Native 移动应用
│   │   ├── app/                       # Expo Router 文件路由
│   │   │   ├── _layout.tsx            # 根 Stack 及主题、查询、手势、键盘 Provider
│   │   │   ├── (drawer)/              # 抽屉导航、首页及登录注册示例
│   │   │   │   └── (tabs)/            # 两个 Tab 示例及其布局
│   │   │   ├── modal.tsx              # 模态页面
│   │   │   └── +not-found.tsx         # 未匹配路由页面
│   │   ├── components/                # 原生组件、登录注册表单
│   │   ├── contexts/                  # 应用主题上下文
│   │   ├── lib/auth-client.ts         # Better Auth Expo 插件、SecureStore
│   │   ├── utils/trpc.ts              # tRPC、React Query、原生 Cookie 转发
│   │   ├── src/env.ts                 # Varlock 生成
│   │   ├── assets/images/             # 图标及启动图
│   │   ├── babel-plugins/             # Hermes async arrow/rest 参数兼容处理
│   │   ├── app.json                   # Expo 配置、scheme、平台标识
│   │   ├── metro.config.js            # Varlock、Uniwind、Reanimated 集成
│   │   └── .env.schema                # 移动端环境变量声明
│   └── fumadocs/                      # 独立 Next.js 文档站，开发端口 4000
│       ├── content/docs/              # MDX 文档内容
│       ├── src/
│       │   ├── app/                   # 首页、/docs、搜索、OG 图、LLM 文本路由
│       │   ├── components/mdx.tsx     # MDX 渲染组件
│       │   ├── lib/source.ts          # 文档源加载、schema、LLM 内容生成
│       │   ├── lib/shared.ts          # 文档路径、站点名称、GitHub 链接配置
│       │   └── proxy.ts              # Markdown 内容协商及重写
│       ├── next.config.mjs            # Fumadocs MDX 集成
│       └── biome.json                 # 文档站自身 Biome 配置
├── packages/
│   ├── api/                           # @zyk-admin-ai/api：共享 tRPC 接口层
│   │   └── src/
│   │       ├── index.ts               # router、publicProcedure、protectedProcedure
│   │       ├── context.ts             # Context 类型：db + session
│   │       └── routers/index.ts       # appRouter 与 AppRouter 类型导出
│   ├── auth/                          # @zyk-admin-ai/auth：认证工厂
│   │   └── src/index.ts               # createAuth(config, db)、Session 类型
│   ├── db/                            # @zyk-admin-ai/db：数据库访问
│   │   ├── prisma/
│   │   │   ├── schema/
│   │   │   │   ├── schema.prisma      # PostgreSQL 数据源、Prisma Client 生成配置
│   │   │   │   └── auth.prisma        # User、Session、Account、Verification
│   │   │   └── migrations/            # 迁移目录，目前仅占位文件
│   │   ├── src/index.ts               # createPrismaClient(config)、Database 类型
│   │   ├── src/config.ts              # DatabaseConfig 类型
│   │   ├── prisma.config.ts           # Schema 路径、迁移路径、连接配置
│   │   └── .env.schema                # 从 server schema 导入数据库环境变量
│   ├── ui/                            # @zyk-admin-ai/ui：共享 Web UI 源码
│   │   ├── src/components/            # 按钮、表单、消息、附件等组件
│   │   ├── src/hooks/                 # 共享 Hook 预留目录，目前仅占位文件
│   │   ├── src/lib/utils.ts           # 样式工具函数
│   │   ├── src/styles/globals.css     # Tailwind、主题变量、设计 Token
│   │   └── components.json            # shadcn Base UI / base-lyra 配置
│   └── config/                        # @zyk-admin-ai/config
│       └── tsconfig.base.json         # 共享严格 TypeScript 配置
├── .agents/skills/                    # 项目可用的开发技能
├── AGENTS.md                          # 项目结构、架构和全局代码规范
├── README.md                          # 项目介绍与开发说明
├── package.json                       # 根脚本与 packageManager 声明
├── pnpm-workspace.yaml                # Workspace、依赖 catalog、override
├── pnpm-lock.yaml                     # 锁定实际解析的依赖版本
├── turbo.json                         # 任务依赖、缓存、环境变量透传
├── biome.json                         # Ultracite / Biome 根配置
├── tsconfig.json                      # 引用共享 TypeScript 配置
├── bunfig.toml                        # 关闭 Bun 自动加载 dotenv
├── bts.jsonc                          # Better-T-Stack 脚手架配置记录
└── skills-lock.json                   # 技能安装记录
```

`node_modules/`、`.next/`、`.turbo/`、`.expo/`、`.source/`、`dist/`、Prisma `generated/` 和 Varlock `env.ts` 属于依赖、缓存或生成产物，不作为业务代码维护。上面的目录树只列环境变量 schema，不展示本地环境变量值。

## 技术栈与实现位置

| 层次 | 当前技术 | 实现位置与职责 |
| --- | --- | --- |
| 工程管理 | pnpm 12、Turborepo 2、TypeScript | 根目录声明 pnpm 12.15.0；workspace 管包，catalog 集中管理部分依赖，Turbo 编排任务 |
| Web | Next.js 16、React 19、App Router | `apps/web`；服务端布局/会话检查与客户端交互结合，启用 typedRoutes 和 React Compiler |
| Web UI | Tailwind CSS 4、shadcn、Base UI、Lucide、next-themes、Sonner | `packages/ui` 提供组件及样式，`apps/web` 提供业务组件 |
| 表单与数据状态 | TanStack Form、Zod 4、TanStack Query 5 | 两端登录注册表单及查询；tRPC 使用 Query 集成 |
| 移动端 | Expo SDK 58、React Native 0.88、Expo Router | `apps/native`；Stack + Drawer + Tabs，支持开发构建 |
| 原生 UI | HeroUI Native、Uniwind、Reanimated | 移动端样式、主题、交互基础，与 Web UI 各自实现 |
| HTTP 服务 | Hono 4、Node.js、`@hono/node-server` | `apps/server/src/index.ts`；开发用 tsx watch，构建用 tsdown |
| 类型安全接口 | tRPC 11、`@hono/trpc-server` | `packages/api` 定义接口，Hono 挂载 `/trpc/*`，客户端共享 `AppRouter` 类型 |
| 身份认证 | Better Auth 1.7、Prisma Adapter、Expo 插件 | `packages/auth` 定义工厂，`apps/server` 实例化并挂载认证路由 |
| 数据持久化 | Prisma 7、PostgreSQL、`@prisma/adapter-pg`、pg | `packages/db`；使用 PostgreSQL driver adapter 创建客户端 |
| 文档站 | Next.js 16、Fumadocs、MDX | `apps/fumadocs`；独立内容、页面、搜索、Markdown/LLM 导出 |
| 环境配置 | Varlock | 各应用自有 `.env.schema`；Next.js/Metro 集成及服务端启动加载 |
| 代码质量 | Ultracite 8、Biome、严格 TypeScript | 根 Biome 使用 core/react/next 预设；文档站另有本地配置 |

各应用的 React、Next.js、TypeScript 等版本声明并不完全一致，修改依赖前检查对应包和 lockfile，不假设整个仓库使用相同版本。

## 调用链与模块边界

```text
apps/web ─────┐
             ├── tRPC /trpc/* ──> apps/server (Hono)
apps/native ─┘                      ├── context：读取会话，注入 { db, session }
                                    └── packages/api：appRouter / procedure
                                          └── ctx.db ──> packages/db ──> PostgreSQL

Web / Native Auth Client ──> /api/auth/* ──> packages/auth
                                               └── Prisma Adapter ──> packages/db

apps/fumadocs ──> 本地 MDX 文档源（当前未接入上述业务 API）
```

### Web 与 API

- `apps/web/src/utils/trpc.ts` 使用 `createTRPCContext<AppRouter>()`、`httpBatchLink` 和 React Query；浏览器复用 QueryClient，服务端调用创建新的 QueryClient。
- tRPC 请求地址来自 `NEXT_PUBLIC_SERVER_URL`，浏览器请求设置 `credentials: "include"`，携带会话 Cookie。
- `apps/web/src/components/providers.tsx` 装配主题、QueryClientProvider、TRPCProvider、查询开发工具和 Toaster。
- `/dashboard` 的服务端页面转发请求头调用认证服务获取会话，缺少用户时跳转 `/login`；客户端组件再调用 `privateData`。
- Next.js Web 当前没有承载业务 API Route Handler；认证和业务 API 由独立 Hono 服务提供。文档站自身的搜索等 Route Handler 属于文档站功能。

### 服务端与共享接口

- `apps/server/src/services.ts` 是实例装配入口：`createPrismaClient(ENV)` 创建数据库客户端，再通过 `createAuth(ENV, db)` 创建认证实例。
- Hono 入口挂载日志和 CORS；`GET /` 返回 `OK`，`GET/POST /api/auth/*` 委托 Better Auth，`/trpc/*` 委托 tRPC Router。
- `apps/server/src/context.ts` 用请求头调用 `auth.api.getSession()`，向 API 注入数据库和会话。`packages/api` 只定义 Context 类型，不自行加载应用环境变量。
- `packages/api/src/index.ts` 提供公开与受保护 procedure。`protectedProcedure` 仅检查会话是否存在，失败返回 `UNAUTHORIZED`；当前未实现角色/资源级权限判断。
- 目前 Router 只有公开的 `healthCheck` 和受保护的 `privateData`，后者返回提示及当前用户；尚无业务 CRUD 模块。
- 共享包通过 `package.json` 的 exports 暴露 TypeScript 源码，由消费方编译；服务端 tsdown 构建显式打包 `@zyk-admin-ai/*` 依赖。

### 认证与数据库

- `packages/auth/src/index.ts` 接收配置及数据库实例，启用邮箱密码登录和 Better Auth Expo 插件。
- Web 使用 Better Auth React 客户端；原生端额外使用 Expo 客户端插件和 `expo-secure-store`，并在 tRPC 请求头手动转发会话 Cookie。
- 原生 tRPC 请求设置 `credentials: "omit"`，Expo Web 分支使用 `credentials: "include"`；两者的 Cookie 处理路径不同。
- 认证配置包含 Web Origin、`zyk-admin-ai://`、Expo 和本地开发 Origin；Cookie 当前配置为 `sameSite: "none"`、`secure: true`、`httpOnly: true`，更改域名、协议或登录链路时需同时核对前后端配置。
- Prisma Schema 拆为数据源/生成器配置和认证模型文件；现有模型只有 `User`、`Session`、`Account`、`Verification`。存在 `Account` 模型不表示已配置第三方 OAuth。
- Prisma Client 输出到 `packages/db/prisma/generated/`，业务访问使用 `createPrismaClient` 与注入的 `ctx.db`。当前迁移目录只有占位文件，没有已提交的迁移历史。

### 移动端与文档站

- 原生页面位于 `apps/native/app`，不同于 Web 的 `src/app`；目前未见应用内 `ios/`、`android/` 原生工程目录。
- 移动端复用 API 类型和认证协议，UI 使用独立的 HeroUI Native / Uniwind 实现；`packages/ui` 当前服务于 Web，不能直接作为原生组件库使用。
- `apps/fumadocs/content/docs` 存储 MDX，`src/lib/source.ts` 负责加载。站点提供 `/docs`、`/api/search`、`/og/docs/*`、`/llms.txt`、`/llms-full.txt` 和 `/llms.mdx/docs/*`。
- `proxy.ts` 根据路径和 Markdown Accept 请求重写内容地址。站点名称、GitHub 信息在 `src/lib/shared.ts` 中仍有模板占位配置，接入项目内容时需要更新。

## 环境变量与生成代码

| 所属位置 | 关键变量 | 加载方式 |
| --- | --- | --- |
| `apps/web/.env.schema` | `NODE_ENV`、`NEXT_PUBLIC_SERVER_URL` | Next.js Varlock 插件；当前 Web 客户端通过 `process.env.NEXT_PUBLIC_SERVER_URL` 读取公开地址 |
| `apps/server/.env.schema` | `NODE_ENV`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、`CORS_ORIGIN`、`DATABASE_URL` | `src/env.server.ts` 先加载 `varlock/auto-load`，再导出生成的 `ENV` |
| `apps/native/.env.schema` | `NODE_ENV`、`EXPO_PUBLIC_SERVER_URL` | Varlock Metro/Babel 集成，源码读取生成的 `ENV` |
| `packages/db/.env.schema` | 从 server schema 导入 `NODE_ENV`、`DATABASE_*` | Prisma CLI 配置加载 Varlock，运行数据库工具时使用 |

- 修改 schema 后执行 `pnpm run env:generate`；根 `postinstall` 也会生成 Web、Server、Native、DB 的 `src/env.ts`。生成类型不等于替后续独立命令加载环境变量。
- 提交 `.env.schema`，本地密钥放在忽略的环境文件或部署环境；不要写入本文件。共享数据库/认证包接收应用传入的配置或客户端。
- Prisma Schema 变化后执行 `pnpm run db:generate`；首次安装、类型检查及构建前也应确保客户端已生成。
- Better Auth 插件或 Schema 配置变化后，执行 `pnpm run auth:generate`，检查 `auth.prisma` 的变化，再通过 Prisma 工作流应用数据库变更。
- 独立运行依赖 Varlock 的工具时，从拥有 schema 的应用/包目录启动，或使用现有根目录封装脚本。

## 常用命令与任务编排

从仓库根目录执行：

| 命令 | 用途 |
| --- | --- |
| `pnpm install` | 安装 Workspace 依赖并生成环境类型 |
| `pnpm run dev` | Turbo 启动所有带 dev 脚本的应用，包含移动端和文档站 |
| `pnpm run dev:web` | 单独启动 Web，`http://localhost:3001` |
| `pnpm run dev:server` | 单独启动 API，`http://localhost:3000` |
| `pnpm run dev:native` | 启动 Expo 开发服务 |
| `pnpm --filter fumadocs dev` | 启动文档站，`http://localhost:4000` |
| `pnpm --filter native ios` / `pnpm --filter native android` | 构建并运行移动端开发应用 |
| `pnpm run build` | Turbo 执行各包已声明的 build，非所有包均有构建脚本 |
| `pnpm run check-types` | 检查已声明 check-types 脚本的包 |
| `pnpm --filter fumadocs types:check` | 文档站单独生成路由类型并检查类型，其脚本名与根任务不同 |
| `pnpm run check` / `pnpm run fix` | Ultracite 检查 / 自动修复 |
| `pnpm run env:generate` | 重新生成各应用及 DB 的环境类型 |
| `pnpm run db:generate` | 生成 Prisma Client |
| `pnpm run db:push` | 直接同步数据库结构，执行前确认目标库及变更 |
| `pnpm run db:migrate` | 创建/应用开发迁移 |
| `pnpm --filter @zyk-admin-ai/db db:migrate:deploy` | 应用已提交迁移 |
| `pnpm run db:studio` | 打开 Prisma Studio |
| `pnpm run auth:generate` | 使用 server 环境及认证实例生成认证 Schema |

Turbo 的 `build` 依赖上游 `^build`，缓存 `dist/**` 与 `.next/**`（排除 Next 缓存目录）；`dev` 是不缓存的持续任务；环境文件变化参与缓存失效。只启动 Web 不会自动启动 Hono API，首页连通检查与认证还需要后端和对应数据库配置。

## 开发时的定位与约束

- Web 路由/页面放 `apps/web/src/app`，页面专属组件就近放置；跨页面业务组件放 `apps/web/src/components`。
- 跨 Web 场景复用的基础组件放 `packages/ui/src/components`，通过 `@zyk-admin-ai/ui/components/*` 导入；主题和设计 Token 统一修改 `packages/ui/src/styles/globals.css`。
- 新增业务接口从 `packages/api/src/routers` 扩展并注册到 `appRouter`，复用现有 procedure；Hono 入口保持 HTTP 装配职责。新增输入通过 Zod 等方式在服务端验证。
- 数据模型放 `packages/db/prisma/schema`，共享认证配置放 `packages/auth`，实例与应用环境装配留在 `apps/server`。
- 当前没有独立的业务 service/repository 层、RBAC、AI SDK 接入或专用测试脚本/测试框架配置；后续新增时明确职责并更新本文件，勿将预留目录或 UI 消息组件描述成完整业务实现。
- 文档站使用自身 Biome 配置及 `types:check` 脚本，根目录检查不等价于覆盖它的所有检查。
- 本次核对发现根 `biome.json` 中的 `nursery.useTailwindSortedClasses` 被当前实际执行的 Biome 判定为未知配置键，导致 Ultracite 检查在加载配置时退出。处理 lint 配置时先核对安装版本与规则名称；这属于现有配置问题，本次结构文档更新未修改它。
- 在 `apps/web` 内修改代码前，还需阅读其 `AGENTS.md`；该文件要求先查阅当前安装的 Next.js `dist/docs/` 对应指南，再编写框架代码。
- 保留下面已有的 Ultracite 规范。架构描述应以实际源码为准，避免把脚手架配置或未来规划当作已完成能力。

---

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm exec ultracite fix`
- **Check for issues**: `pnpm exec ultracite check`
- **Diagnose setup**: `pnpm exec ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome will catch most mechanical issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm exec ultracite fix` before committing to ensure compliance.
