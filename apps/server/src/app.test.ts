import { describe, expect, it } from "vitest";

import { app } from "./app";

describe("app", () => {
	it("responds OK on the health route", async () => {
		const res = await app.request("/");

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("OK");
	});
});
