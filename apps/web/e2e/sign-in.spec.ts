import { expect, type Page, test } from "@playwright/test";

import {
	countPosts,
	DASHBOARD_PATH,
	fillCredentials,
	LOGIN_PATH,
	registerUser,
	uniqueUsername,
	VALID_PASSWORD,
} from "./support";

const SIGN_IN_URL = "**/api/auth/sign-in/username";
const INVALID_CREDENTIALS = "用户名或密码错误";

const countSignInPosts = (page: Page) => countPosts(page, "/sign-in/username");

const gotoSignIn = async (page: Page) => {
	await page.goto("/login");
	await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
};

const submitButton = (page: Page) =>
	page.getByRole("button", { exact: true, name: "登录" });

const signInAs = async (page: Page, username: string, password: string) => {
	await gotoSignIn(page);
	await fillCredentials(page, username, password);
	await submitButton(page).click();
};

test("sign-in form only asks for username and password", async ({ page }) => {
	await gotoSignIn(page);

	const form = page.locator("form");
	await expect(form.locator("input")).toHaveCount(2);
	await expect(form.getByLabel("用户名")).toBeVisible();
	await expect(form.getByLabel("密码")).toHaveAttribute("type", "password");
});

test("empty submission shows required errors without a request", async ({
	page,
}) => {
	const signInPosts = countSignInPosts(page);
	await gotoSignIn(page);

	await submitButton(page).click();

	await expect(page.getByText("请输入用户名")).toBeVisible();
	await expect(page.getByText("请输入密码")).toBeVisible();
	expect(signInPosts()).toBe(0);
});

test("valid credentials open the dashboard", async ({ page, request }) => {
	const username = uniqueUsername("Dana");
	await registerUser(request, username);

	await signInAs(page, username, VALID_PASSWORD);

	await expect(page).toHaveURL(DASHBOARD_PATH);
});

test("the username matches regardless of case", async ({ page, request }) => {
	const username = uniqueUsername("Erin");
	await registerUser(request, username);

	await signInAs(page, username.toUpperCase(), VALID_PASSWORD);

	await expect(page).toHaveURL(DASHBOARD_PATH);
});

test("a wrong password and an unknown username show the same error", async ({
	page,
	request,
}) => {
	const username = uniqueUsername("Finn");
	await registerUser(request, username);

	await signInAs(page, username, "wrong-password");
	await expect(page.getByText(INVALID_CREDENTIALS)).toBeVisible();
	await expect(page).toHaveURL(LOGIN_PATH);

	await signInAs(page, uniqueUsername("ghost"), VALID_PASSWORD);
	await expect(page.getByText(INVALID_CREDENTIALS).first()).toBeVisible();
	await expect(page).toHaveURL(LOGIN_PATH);
});

test("the session survives a page reload", async ({ page, request }) => {
	const username = uniqueUsername("Gail");
	await registerUser(request, username);
	await signInAs(page, username, VALID_PASSWORD);
	await expect(page).toHaveURL(DASHBOARD_PATH);

	await page.reload();

	await expect(page).toHaveURL(DASHBOARD_PATH);
	await expect(page.getByText(username).first()).toBeVisible();
});

test("a signed-in user visiting /login is sent to the dashboard", async ({
	page,
	request,
}) => {
	const username = uniqueUsername("Hank");
	await registerUser(request, username);
	await signInAs(page, username, VALID_PASSWORD);
	await expect(page).toHaveURL(DASHBOARD_PATH);

	await page.goto("/login");

	await expect(page).toHaveURL(DASHBOARD_PATH);
});

test("the submit button is disabled while a sign-in is in flight", async ({
	page,
	request,
}) => {
	const username = uniqueUsername("Ivy");
	await registerUser(request, username);
	const signInPosts = countSignInPosts(page);
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(SIGN_IN_URL, async (route) => {
		if (route.request().method() === "POST") {
			await gate;
		}
		await route.continue();
	});

	await signInAs(page, username, VALID_PASSWORD);

	await expect(page.getByRole("button", { name: "登录中..." })).toBeDisabled();
	await page.getByLabel("密码").press("Enter");
	await page.getByLabel("密码").press("Enter");
	release();

	await expect(page).toHaveURL(DASHBOARD_PATH);
	expect(signInPosts()).toBe(1);
});

test("a network failure shows a retryable error", async ({ page, request }) => {
	const username = uniqueUsername("Jack");
	await registerUser(request, username);
	await page.route(SIGN_IN_URL, async (route) => {
		if (route.request().method() === "POST") {
			await route.abort("internetdisconnected");
			return;
		}
		await route.continue();
	});

	await signInAs(page, username, VALID_PASSWORD);

	await expect(page.getByText("网络异常，请稍后重试")).toBeVisible();
	await expect(submitButton(page)).toBeEnabled();

	await page.unroute(SIGN_IN_URL);
	await submitButton(page).click();

	await expect(page).toHaveURL(DASHBOARD_PATH);
});
