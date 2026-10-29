# R02 用户名登录 - 任务清单

> 完成一项后把 `- [ ]` 改为 `- [✅]`

- [✅] 1. Web 登录表单改造
  - [✅] 1.1 `auth-errors.ts` 增加登录场景映射（凭据类错误统一为「用户名或密码错误」）
  - [✅] 1.2 `sign-in-form.tsx` 改为只有用户名、密码两项，必填校验，调用 `authClient.signIn.username`；提交中禁用按钮并显示加载文案；成功跳转 `/dashboard`；失败按映射提示；网络异常可重试
  - 对应验收标准：R02-AC1 ~ R02-AC5、R02-AC8、R02-AC9
  - CR：Codex 提出 0 条，采纳 0 条；不采纳：无
- [✅] 2. 已登录访问 `/login` 跳转
  - [✅] 2.1 新增 `apps/web/src/app/login/auth-forms.tsx`（登录/注册切换，默认登录），`page.tsx` 改为服务端组件，读取会话后已登录 `redirect("/dashboard")`
  - [✅] 2.2 登录、注册表单去掉 `useSession` 驱动的整页 Loader
  - 对应验收标准：R02-AC7
  - CR：Codex 提出 0 条，采纳 0 条；不采纳：无
- [ ] 3. 编写服务端登录接口测试（`apps/server/src/auth.test.ts`）：注册 `Alice` 后以 `Alice`、`alice`、`ALICE` 登录均返回 200 且带会话 Cookie；错误密码与不存在用户名均返回 401 且错误码相同
  - 对应验收标准：R02-AC3 ~ R02-AC5
- [ ] 4. 编写登录 E2E 测试（`apps/web/e2e/sign-in.spec.ts`）：表单只有用户名、密码两个输入框；空提交显示必填提示且不发请求；正确凭据登录跳转 `/dashboard`；大写用户名登录成功；错误密码和不存在用户名都提示「用户名或密码错误」并停留在 `/login`；登录后 `page.reload()` 仍在 `/dashboard` 且显示内容；已登录访问 `/login` 被重定向到 `/dashboard`；挂起请求时按钮禁用且多次点击只发 1 次请求；模拟网络中断提示「网络异常，请稍后重试」，恢复后可再次登录成功
  - 对应验收标准：R02-AC1 ~ R02-AC9
- [ ] 5. 自测并对照 requirements.md 逐条验收
