import { type APIRequestContext, expect, type Page } from "@playwright/test";

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
