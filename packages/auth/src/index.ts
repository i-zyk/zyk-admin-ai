import { expo } from "@better-auth/expo";
import type { Database } from "@zyk-admin-ai/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { username } from "better-auth/plugins";

import {
	isValidUsername,
	PASSWORD_MIN_LENGTH,
	toPlaceholderEmail,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
} from "./username";

export interface AuthConfig {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
}

const SIGN_UP_PATH = "/sign-up/email";

// Accounts are username-only: derive the email and name Better Auth requires
// from the username so clients never send them. Runs before plugin hooks,
// which still validate the username format and uniqueness.
// biome-ignore lint/suspicious/useAwait: createAuthMiddleware requires a Promise-returning handler
const usernameOnlySignUp = createAuthMiddleware(async (ctx) => {
	if (ctx.path !== SIGN_UP_PATH) {
		return;
	}
	const requested: unknown = ctx.body?.username;
	if (typeof requested !== "string" || requested.length === 0) {
		throw new APIError("BAD_REQUEST", {
			code: "USERNAME_REQUIRED",
			message: "Username is required",
		});
	}
	ctx.body.email = toPlaceholderEmail(requested);
	ctx.body.name = requested;
});

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = []
) {
	return betterAuth({
		advanced: {
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: "none",
				secure: true,
			},
		},
		baseURL: env.BETTER_AUTH_URL,
		database: prismaAdapter(database, {
			provider: "postgresql",
		}),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: PASSWORD_MIN_LENGTH,
		},
		hooks: {
			before: usernameOnlySignUp,
		},
		plugins: [
			expo(),
			username({
				maxUsernameLength: USERNAME_MAX_LENGTH,
				minUsernameLength: USERNAME_MIN_LENGTH,
				usernameValidator: isValidUsername,
			}),
		],
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [
			env.CORS_ORIGIN,
			...desktopOrigins,
			"zyk-admin-ai://",
			"exp://",
			"http://localhost:8081",
		],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
