import z from "zod";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 8;

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

// Better Auth requires an email on every user; `.invalid` is a reserved TLD,
// so these addresses can never collide with or be delivered to a real inbox.
const PLACEHOLDER_EMAIL_DOMAIN = "users.zyk-admin-ai.invalid";

export const AUTH_MESSAGES = {
	invalidCredentials: "用户名或密码错误",
	networkError: "网络异常，请稍后重试",
	passwordRequired: "请输入密码",
	passwordTooShort: `密码至少 ${PASSWORD_MIN_LENGTH} 个字符`,
	signInFailed: "登录失败，请稍后重试",
	signUpFailed: "注册失败，请稍后重试",
	usernameFormat: "用户名只能包含英文字母、数字和下划线",
	usernameLength: `用户名长度为 ${USERNAME_MIN_LENGTH}～${USERNAME_MAX_LENGTH} 个字符`,
	usernameRequired: "请输入用户名",
	usernameTaken: "用户名已存在",
} as const;

export const isValidUsername = (username: string): boolean =>
	USERNAME_PATTERN.test(username);

export const toPlaceholderEmail = (username: string): string =>
	`${username.toLowerCase()}@${PLACEHOLDER_EMAIL_DOMAIN}`;

const requiredUsername = z
	.string()
	.trim()
	.min(1, { abort: true, error: AUTH_MESSAGES.usernameRequired });

const requiredPassword = z
	.string()
	.min(1, { abort: true, error: AUTH_MESSAGES.passwordRequired });

export const signUpSchema = z.object({
	password: requiredPassword.min(
		PASSWORD_MIN_LENGTH,
		AUTH_MESSAGES.passwordTooShort
	),
	username: requiredUsername
		.min(USERNAME_MIN_LENGTH, {
			abort: true,
			error: AUTH_MESSAGES.usernameLength,
		})
		.max(USERNAME_MAX_LENGTH, {
			abort: true,
			error: AUTH_MESSAGES.usernameLength,
		})
		.regex(USERNAME_PATTERN, AUTH_MESSAGES.usernameFormat),
});

export const signInSchema = z.object({
	password: requiredPassword,
	username: requiredUsername,
});
