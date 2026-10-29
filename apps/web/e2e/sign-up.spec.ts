import { expect, type Page, type Request, test } from "@playwright/test";

const SERVER_URL = "http://localhost:3000";
const WEB_ORIGIN = "http://localhost:3001";
const SIGN_UP_URL = "**/api/auth/sign-up/email";
const VALID_PASSWORD = "password123";
const DASHBOARD_PATH = /\/dashboard$/;
const LOGIN_PATH = /\/login$/;

const uniqueUsername = (prefix: string): string =>
	`${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const isSignUpPost = (request: Request): boolean =>
	request.method() === "POST" && request.url().endsWith("/sign-up/email");

const countSignUpPosts = (page: Page): (() => number) => {
	let count = 0;
	page.on("request", (request) => {
		if (isSignUpPost(request)) {
			count += 1;
		}
	});
	return () => count;
};

const gotoSignUp = async (page: Page) => {
	await page.goto("/login");
	await expect(page.getByRole("heading", { name: "创建账号" })).toBeVisible();
};

const fillSignUp = async (page: Page, username: string, password: string) => {
	await page.getByLabel("用户名").fill(username);
	await page.getByLabel("密码").fill(password);
};

const submitButton = (page: Page) =>
	page.getByRole("button", { exact: true, name: "注册" });

test("sign-up form only asks for username and password", async ({ page }) => {
	await gotoSignUp(page);

	const form = page.locator("form");
	await expect(form.locator("input")).toHaveCount(2);
	await expect(form.getByLabel("用户名")).toBeVisible();
	await expect(form.getByLabel("密码")).toHaveAttribute("type", "password");
});

test("valid sign-up signs the user in and opens the dashboard", async ({
	page,
}) => {
	await gotoSignUp(page);

	await fillSignUp(page, uniqueUsername("New"), VALID_PASSWORD);
	await submitButton(page).click();

	await expect(page).toHaveURL(DASHBOARD_PATH);
});

test("empty submission shows required errors without a request", async ({
	page,
}) => {
	const signUpPosts = countSignUpPosts(page);
	await gotoSignUp(page);

	await submitButton(page).click();

	await expect(page.getByText("请输入用户名")).toBeVisible();
	await expect(page.getByText("请输入密码")).toBeVisible();
	expect(signUpPosts()).toBe(0);
});

test("invalid username and short password show field errors", async ({
	page,
}) => {
	const signUpPosts = countSignUpPosts(page);
	await gotoSignUp(page);

	await fillSignUp(page, "a.b", "1234567");
	await submitButton(page).click();

	await expect(
		page.getByText("用户名只能包含英文字母、数字和下划线")
	).toBeVisible();
	await expect(page.getByText("密码至少 8 个字符")).toBeVisible();

	await fillSignUp(page, "ab", VALID_PASSWORD);
	await submitButton(page).click();

	await expect(page.getByText("用户名长度为 3～20 个字符")).toBeVisible();
	expect(signUpPosts()).toBe(0);
});

test("a username differing only by case is reported as taken", async ({
	page,
	request,
}) => {
	const username = uniqueUsername("Alice");
	const existing = await request.post(`${SERVER_URL}/api/auth/sign-up/email`, {
		data: { password: VALID_PASSWORD, username },
		headers: { Origin: WEB_ORIGIN },
	});
	expect(existing.ok()).toBe(true);
	await gotoSignUp(page);

	await fillSignUp(page, username.toLowerCase(), VALID_PASSWORD);
	await submitButton(page).click();

	await expect(page.getByText("用户名已存在")).toBeVisible();
	await expect(page).toHaveURL(LOGIN_PATH);
});

test("the submit button is disabled while a sign-up is in flight", async ({
	page,
}) => {
	const signUpPosts = countSignUpPosts(page);
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(SIGN_UP_URL, async (route) => {
		if (route.request().method() === "POST") {
			await gate;
		}
		await route.continue();
	});
	await gotoSignUp(page);

	await fillSignUp(page, uniqueUsername("Busy"), VALID_PASSWORD);
	await submitButton(page).click();

	const pendingButton = page.getByRole("button", { name: "注册中..." });
	await expect(pendingButton).toBeDisabled();
	await page.getByLabel("密码").press("Enter");
	await page.getByLabel("密码").press("Enter");
	release();

	await expect(page).toHaveURL(DASHBOARD_PATH);
	expect(signUpPosts()).toBe(1);
});

test("a network failure shows a retryable error", async ({ page }) => {
	await page.route(SIGN_UP_URL, async (route) => {
		if (route.request().method() === "POST") {
			await route.abort("internetdisconnected");
			return;
		}
		await route.continue();
	});
	await gotoSignUp(page);

	await fillSignUp(page, uniqueUsername("Retry"), VALID_PASSWORD);
	await submitButton(page).click();

	await expect(page.getByText("网络异常，请稍后重试")).toBeVisible();
	await expect(submitButton(page)).toBeEnabled();

	await page.unroute(SIGN_UP_URL);
	await submitButton(page).click();

	await expect(page).toHaveURL(DASHBOARD_PATH);
});

test("an unexpected server error shows a readable message", async ({
	page,
}) => {
	await page.route(SIGN_UP_URL, async (route) => {
		if (route.request().method() === "POST") {
			await route.fulfill({
				body: JSON.stringify({ message: "Internal Server Error" }),
				contentType: "application/json",
				headers: {
					"Access-Control-Allow-Credentials": "true",
					"Access-Control-Allow-Origin": WEB_ORIGIN,
				},
				status: 500,
			});
			return;
		}
		await route.continue();
	});
	await gotoSignUp(page);

	await fillSignUp(page, uniqueUsername("Oops"), VALID_PASSWORD);
	await submitButton(page).click();

	await expect(page.getByText("注册失败，请稍后重试")).toBeVisible();
	await expect(submitButton(page)).toBeEnabled();
});
