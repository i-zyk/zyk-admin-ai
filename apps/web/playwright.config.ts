import { defineConfig, devices } from "@playwright/test";

const WEB_URL = "http://localhost:3001";
const SERVER_URL = "http://localhost:3000";
const isCI = Boolean(process.env.CI);

export default defineConfig({
	forbidOnly: isCI,
	fullyParallel: true,
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	reporter: "list",
	retries: isCI ? 2 : 0,
	testDir: "./e2e",
	use: {
		baseURL: WEB_URL,
		trace: "on-first-retry",
	},
	webServer: [
		{
			command: "pnpm --filter server dev",
			reuseExistingServer: !isCI,
			url: SERVER_URL,
		},
		{
			command: "pnpm dev",
			reuseExistingServer: !isCI,
			timeout: 120_000,
			url: WEB_URL,
		},
	],
});
