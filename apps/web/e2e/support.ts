import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";

export const SERVER_URL = "http://localhost:3000";
export const WEB_ORIGIN = "http://localhost:3001";
export const VALID_PASSWORD = "password123";
export const DASHBOARD_PATH = /\/dashboard$/;
export const LOGIN_PATH = /\/login$/;

export const uniqueUsername = (prefix: string): string =>
	`${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/** Counts POST requests whose URL ends with `pathSuffix` from now on. */
export const countPosts = (page: Page, pathSuffix: string): (() => number) => {
	let count = 0;
	page.on("request", (request) => {
		if (request.method() === "POST" && request.url().endsWith(pathSuffix)) {
			count += 1;
		}
	});
	return () => count;
};

/** Registers a user directly against the API, outside the browser session. */
export const registerUser = async (
	request: APIRequestContext,
	username: string
): Promise<void> => {
	const res = await request.post(`${SERVER_URL}/api/auth/sign-up/email`, {
		data: { password: VALID_PASSWORD, username },
		headers: { Origin: WEB_ORIGIN },
	});
	expect(res.ok()).toBe(true);
};

export const fillCredentials = async (
	page: Page,
	username: string,
	password: string
): Promise<void> => {
	await page.getByLabel("用户名").fill(username);
	await page.getByLabel("密码").fill(password);
};

const SAFE_USERNAME = /^[A-Za-z0-9_]+$/;

/**
 * Moves every session of `username` into the past. Runs through the db
 * package's Prisma CLI, whose config loads DATABASE_URL via varlock.
 */
export const expireSessionsOf = (username: string): void => {
	if (!SAFE_USERNAME.test(username)) {
		throw new Error(`Refusing to build SQL for username ${username}`);
	}
	const sql = `UPDATE "session" SET "expiresAt" = now() - interval '1 minute' WHERE "userId" IN (SELECT "id" FROM "user" WHERE "username" = '${username.toLowerCase()}');`;
	// rootDir is the absolute e2e/ directory; specs compile to CommonJS, so
	// import.meta is unavailable and lint forbids __dirname.
	const dbPackageDir = resolve(
		test.info().config.rootDir,
		"../../../packages/db"
	);
	execFileSync("pnpm", ["exec", "prisma", "db", "execute", "--stdin"], {
		cwd: dbPackageDir,
		input: sql,
		stdio: ["pipe", "ignore", "inherit"],
	});
};

/** Registers through the UI, leaving the page signed in on /dashboard. */
export const signUpViaUi = async (page: Page, username: string) => {
	await page.goto("/login");
	await page.getByRole("button", { name: "没有账号？去注册" }).click();
	await fillCredentials(page, username, VALID_PASSWORD);
	await page
		.locator("form")
		.getByRole("button", { exact: true, name: "注册" })
		.click();
	await expect(page).toHaveURL(DASHBOARD_PATH);
};
