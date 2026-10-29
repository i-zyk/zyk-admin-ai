# R03 登录后首页、退出与访问控制 - 任务清单

> 完成一项后把 `- [ ]` 改为 `- [✅]`

- [✅] 1. 受保护接口调整：`packages/api/src/routers/index.ts` 的 `privateData` 返回 `{ message, username }`；检索 `apps/web`、`apps/native` 中对 `privateData` 的引用并同步修改
  - 对应验收标准：R03-AC6
  - CR：Codex 提出 0 条，采纳 0 条；不采纳：无
  - 测试：首次 N5 的 E2E 有 3 条不稳定失败（误在测试未通过时提交了勾选），根因是 R02 的水合前提交缺陷，修复后全量测试通过
- [✅] 2. 编写服务端访问控制测试（`apps/server/src/access.test.ts`）：无 Cookie 调用 `privateData` 返回 401；注册后带 Cookie 调用返回原始大小写用户名；`POST /api/auth/sign-out` 后用旧 Cookie 调用返回 401；把该用户 `session.expiresAt` 改为过去时间后调用返回 401
  - 对应验收标准：R03-AC3、R03-AC5、R03-AC6
  - CR：Codex 提出 0 条，采纳 0 条；不采纳：无
- [✅] 3. 首页与退出
  - [✅] 3.1 新增 `apps/web/src/lib/sign-out.ts`（`useSignOut`：退出、跳转 `/login`、网络异常提示、进行中状态）
  - [✅] 3.2 新增 `apps/web/src/app/dashboard/sign-out-button.tsx`；`page.tsx` 显示「欢迎，<用户名>」和退出按钮，获取会话失败或无用户时 `redirect("/login")`；删除 `dashboard.tsx`
  - [✅] 3.3 `user-menu.tsx` 显示用户名、不显示占位邮箱，退出复用 `useSignOut`
  - 对应验收标准：R03-AC1、R03-AC2、R03-AC4、R03-AC5、R03-AC7
  - CR：Codex 提出 0 条，采纳 0 条；不采纳：无
- [✅] 4. 编写首页与访问控制 E2E 测试（`apps/web/e2e/dashboard.spec.ts`）：以 `Alice_xxx` 注册后首页显示原始大小写用户名且页面不含占位邮箱；点击退出跳转 `/login`，再访问 `/dashboard` 被重定向到 `/login`；未登录直接访问 `/dashboard` 被重定向到 `/login`；通过 `@zyk-admin-ai/db` 把会话 `expiresAt` 改为过去后刷新 `/dashboard` 被重定向到 `/login`；用 `page.route` 让退出请求失败时提示「网络异常，请稍后重试」且仍停留在首页，恢复后再次退出成功
  - 对应验收标准：R03-AC1 ~ R03-AC5、R03-AC7
  - CR：Codex 提出 0 条，采纳 0 条；不采纳：无
- [ ] 5. 自测并对照 requirements.md 逐条验收
