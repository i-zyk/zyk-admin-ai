import { expect, type Page, test } from "@playwright/test";

import {
	DASHBOARD_PATH,
	expireSessionsOf,
	LOGIN_PATH,
	SERVER_URL,
	signUpViaUi,
	uniqueUsername,
} from "./support";

const SIGN_OUT_URL = "**/api/auth/sign-out";
const PLACEHOLDER_EMAIL_DOMAIN = "zyk-admin-ai.invalid";

const signOutButton = (page: Page) =>
	page.getByRole("main").getByRole("button", { name: "退出登录" });

test("the dashboard greets the user by the username they chose", async ({
	page,
}) => {
	const username = uniqueUsername("Alice");

	await signUpViaUi(page, username);

	await expect(page.getByRole("main")).toContainText(`欢迎，${username}`);
	await expect(page.locator("body")).not.toContainText(
		PLACEHOLDER_EMAIL_DOMAIN
	);
});

test("signing out returns to /login and locks the page and API", async ({
	page,
	playwright,
}) => {
	await signUpViaUi(page, uniqueUsername("Owen"));
	const cookieHeader = (await page.context().cookies(SERVER_URL))
		.map(({ name, value }) => `${name}=${value}`)
		.join("; ");
	expect(cookieHeader).toContain("session_token");

	await signOutButton(page).click();

	await expect(page).toHaveURL(LOGIN_PATH);
	await page.goto("/dashboard");
	await expect(page).toHaveURL(LOGIN_PATH);

	const api = await playwright.request.newContext();
	const res = await api.get(`${SERVER_URL}/trpc/privateData`, {
		headers: { Cookie: cookieHeader },
	});
	expect(res.status()).toBe(401);
	await api.dispose();
});

test("an anonymous visitor is sent from /dashboard to /login", async ({
	page,
}) => {
	await page.goto("/dashboard");

	await expect(page).toHaveURL(LOGIN_PATH);
});

test("an expired session is sent back to /login", async ({ page }) => {
	const username = uniqueUsername("Pete");
	await signUpViaUi(page, username);

	expireSessionsOf(username);
	await page.reload();

	await expect(page).toHaveURL(LOGIN_PATH);
});

test("the sign-out button is disabled while signing out", async ({ page }) => {
	await signUpViaUi(page, uniqueUsername("Quin"));
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(SIGN_OUT_URL, async (route) => {
		if (route.request().method() === "POST") {
			await gate;
		}
		await route.continue();
	});

	await signOutButton(page).click();

	await expect(page.getByRole("button", { name: "退出中..." })).toBeDisabled();
	release();
	await expect(page).toHaveURL(LOGIN_PATH);
});

test("a failed sign-out keeps the session and can be retried", async ({
	page,
}) => {
	await signUpViaUi(page, uniqueUsername("Rita"));
	await page.route(SIGN_OUT_URL, async (route) => {
		if (route.request().method() === "POST") {
			await route.abort("internetdisconnected");
			return;
		}
		await route.continue();
	});

	await signOutButton(page).click();

	await expect(page.getByText("网络异常，请稍后重试")).toBeVisible();
	await expect(page).toHaveURL(DASHBOARD_PATH);

	await page.unroute(SIGN_OUT_URL);
	await signOutButton(page).click();

	await expect(page).toHaveURL(LOGIN_PATH);
});
