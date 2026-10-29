import { describe, expect, it } from "vitest";

import { app } from "./app";
import { db } from "./services";

const WEB_ORIGIN = "http://localhost:3001";
const VALID_PASSWORD = "password123";
const SESSION_COOKIE = "better-auth.session_token";

const uniqueUsername = (prefix: string): string =>
	`${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const signUp = (body: Record<string, unknown>) =>
	app.request("/api/auth/sign-up/email", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json", Origin: WEB_ORIGIN },
		method: "POST",
	});

const signIn = (body: Record<string, unknown>) =>
	app.request("/api/auth/sign-in/username", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json", Origin: WEB_ORIGIN },
		method: "POST",
	});

const errorCode = async (res: Response): Promise<string | undefined> => {
	const body = (await res.json()) as { code?: string };
	return body.code;
};

describe("POST /api/auth/sign-up/email", () => {
	it("creates a user from username and password and starts a session", async () => {
		const username = uniqueUsername("New");

		const res = await signUp({ password: VALID_PASSWORD, username });

		expect(res.status).toBe(200);
		expect(res.headers.get("set-cookie")).toContain(SESSION_COOKIE);
		const user = await db.user.findUnique({
			where: { username: username.toLowerCase() },
		});
		expect(user?.displayUsername).toBe(username);
		expect(user?.name).toBe(username);
	});

	it("derives a placeholder email and ignores a client-supplied one", async () => {
		const username = uniqueUsername("Mail");

		const res = await signUp({
			email: "someone@example.com",
			name: "Someone Else",
			password: VALID_PASSWORD,
			username,
		});

		expect(res.status).toBe(200);
		const user = await db.user.findUnique({
			where: { username: username.toLowerCase() },
		});
		expect(user?.email).toBe(
			`${username.toLowerCase()}@users.zyk-admin-ai.invalid`
		);
		expect(user?.name).toBe(username);
	});

	it("stores only a password hash", async () => {
		const username = uniqueUsername("hash");

		await signUp({ password: VALID_PASSWORD, username });

		const account = await db.account.findFirst({
			where: { providerId: "credential", user: { username } },
		});
		expect(account?.password).toBeTruthy();
		expect(account?.password).not.toContain(VALID_PASSWORD);
	});

	it("rejects a request without a username", async () => {
		const res = await signUp({ password: VALID_PASSWORD });

		expect(res.status).toBe(400);
		expect(await errorCode(res)).toBe("USERNAME_REQUIRED");
	});

	it.each([
		["ab", "USERNAME_TOO_SHORT"],
		["a".repeat(21), "USERNAME_TOO_LONG"],
		["a.b_c", "INVALID_USERNAME"],
		["user-name", "INVALID_USERNAME"],
		["中文用户名", "INVALID_USERNAME"],
	])("rejects the invalid username %j", async (username, code) => {
		const res = await signUp({ password: VALID_PASSWORD, username });

		expect(res.status).toBe(400);
		expect(await errorCode(res)).toBe(code);
	});

	it("rejects a password shorter than 8 characters", async () => {
		const res = await signUp({
			password: "1234567",
			username: uniqueUsername("short"),
		});

		expect(res.status).toBe(400);
		expect(await errorCode(res)).toBe("PASSWORD_TOO_SHORT");
	});

	it("treats usernames that differ only by case as duplicates", async () => {
		const username = uniqueUsername("Alice");
		await signUp({ password: VALID_PASSWORD, username });

		const res = await signUp({
			password: VALID_PASSWORD,
			username: username.toLowerCase(),
		});

		expect(res.status).toBe(400);
		expect(await errorCode(res)).toBe("USERNAME_IS_ALREADY_TAKEN");
		const count = await db.user.count({
			where: { username: username.toLowerCase() },
		});
		expect(count).toBe(1);
	});
});

describe("POST /api/auth/sign-in/username", () => {
	it.each([
		["the original case", (name: string) => name],
		["lower case", (name: string) => name.toLowerCase()],
		["upper case", (name: string) => name.toUpperCase()],
	])("signs in with the username in %s", async (_label, toInput) => {
		const username = uniqueUsername("Alice");
		await signUp({ password: VALID_PASSWORD, username });

		const res = await signIn({
			password: VALID_PASSWORD,
			username: toInput(username),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("set-cookie")).toContain(SESSION_COOKIE);
	});

	it("rejects a wrong password and an unknown username identically", async () => {
		const username = uniqueUsername("Carol");
		await signUp({ password: VALID_PASSWORD, username });

		const wrongPassword = await signIn({
			password: "wrong-password",
			username,
		});
		const unknownUser = await signIn({
			password: VALID_PASSWORD,
			username: uniqueUsername("ghost"),
		});

		expect(wrongPassword.status).toBe(401);
		expect(unknownUser.status).toBe(401);
		expect(wrongPassword.headers.get("set-cookie")).toBeNull();
		const codes = [
			await errorCode(wrongPassword),
			await errorCode(unknownUser),
		];
		expect(codes).toEqual([
			"INVALID_USERNAME_OR_PASSWORD",
			"INVALID_USERNAME_OR_PASSWORD",
		]);
	});
});
