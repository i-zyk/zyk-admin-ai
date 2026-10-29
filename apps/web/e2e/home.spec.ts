import { expect, test } from "@playwright/test";

test("home page reaches the API server", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByText("Connected", { exact: true })).toBeVisible();
});
