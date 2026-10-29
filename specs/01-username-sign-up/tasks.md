# R01 用户名注册 - 任务清单

> 完成一项后把 `- [ ]` 改为 `- [✅]`

- [✅] 1. 修复 lint 配置并搭建测试基建
  - [✅] 1.1 修复根 `biome.json` 中未知的 `nursery.useTailwindSortedClasses` 键，确认 `pnpm run check` 能正常运行
  - [✅] 1.2 拆分 `apps/server/src/index.ts`：Hono 应用装配移到 `src/app.ts` 并导出 `app`，`index.ts` 只负责 `serve`
  - [✅] 1.3 `apps/server` 引入 Vitest：`vitest.config.ts`、`test` 脚本（`vitest run`，环境由 `env.server.ts` 的 varlock auto-load 加载），添加一个调用 `GET /` 的冒烟测试
  - [✅] 1.4 `apps/web` 引入 Playwright：`playwright.config.ts`（`webServer` 启动 server 3000 与 web 3001）、`test:e2e` 脚本，添加访问首页的冒烟用例
  - [✅] 1.5 根 `package.json` 增加 `test`、`test:e2e`，`turbo.json` 增加对应任务；`AGENTS.md` 补充测试命令
  - 对应验收标准：无（基建，支撑 R01-AC1 ~ R01-AC11 的测试）
  - CR：Codex 提出 1 条，采纳 1 条（E2E 文本匹配改为 exact，避免 Disconnected 误判）；不采纳：无
- [✅] 2. 服务端启用用户名认证
  - [✅] 2.1 新增 `packages/auth/src/username.ts`：用户名/密码规则常量、Zod schema、中文错误文案、占位邮箱生成函数
  - [✅] 2.2 `packages/auth/src/index.ts` 启用 `username` 插件（长度 3～20、仅字母数字下划线、默认小写规范化），显式 `minPasswordLength: 8`，添加 `/sign-up/email` 的 `hooks.before`（缺少用户名拒绝，生成占位 email、name）
  - [✅] 2.3 执行 `pnpm run auth:generate` 更新 `auth.prisma`，`pnpm run db:migrate` 生成首个迁移，`pnpm run db:generate`
  - 对应验收标准：R01-AC6、R01-AC7、R01-AC8
  - CR：Codex 提出 1 条，采纳 0 条；不采纳：P1「Web/移动端注册表单未带 username 会被拒绝」——Web 表单在本需求任务 4 改造，移动端不改已与用户确认
- [✅] 3. 编写服务端注册接口测试（`apps/server/src/auth.test.ts`）：合法注册返回 200 且带会话 Cookie；缺少用户名、用户名过短/过长、含非法字符（如 `a.b`、`中文`）、密码少于 8 位均返回 400；已有 `Alice` 后注册 `alice` 被拒绝；数据库中 `username` 为小写、`account.password` 不等于明文
  - 对应验收标准：R01-AC6、R01-AC7、R01-AC8
  - CR：Codex 提出 0 条，采纳 0 条；不采纳：无
- [ ] 4. Web 注册表单改造
  - [ ] 4.1 `apps/web/package.json` 增加 `@zyk-admin-ai/auth` 依赖；`auth-client.ts` 加 `usernameClient()`
  - [ ] 4.2 新增 `apps/web/src/lib/auth-errors.ts`：Better Auth 错误码与网络错误到中文提示的映射
  - [ ] 4.3 `sign-up-form.tsx` 改为只有用户名、密码两项，使用共享 Zod schema 显示字段错误；提交中禁用按钮并显示加载文案；成功后跳转 `/dashboard`；失败按映射提示；网络异常提示「网络异常，请稍后重试」并可重新提交
  - 对应验收标准：R01-AC1 ~ R01-AC5、R01-AC9 ~ R01-AC11
- [ ] 5. 编写注册 E2E 测试（`apps/web/e2e/sign-up.spec.ts`）：表单只有用户名、密码两个输入框；合法注册后跳转 `/dashboard`；空提交显示必填提示且无注册请求；非法用户名、短密码显示提示；仅大小写不同的重复用户名提示「用户名已存在」；拦截注册请求使其挂起时按钮禁用、多次点击只发 1 次请求；用 `page.route` 模拟网络中断时提示「网络异常，请稍后重试」，恢复后再次提交成功；模拟服务端 500 时显示中文错误提示
  - 对应验收标准：R01-AC1 ~ R01-AC6、R01-AC9 ~ R01-AC11
- [ ] 6. 自测并对照 requirements.md 逐条验收
