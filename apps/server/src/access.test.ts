import { describe, expect, it } from "vitest";

import { app } from "./app";
import { db } from "./services";

const WEB_ORIGIN = "http://localhost:3001";
const VALID_PASSWORD = "password123";
const ONE_MINUTE_MS = 60_000;

const uniqueUsername = (prefix: string): string =>
	`${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/** Signs up a user and returns the Cookie header for its new session. */
const signUpWithSession = async (username: string): Promise<string> => {
	const res = await app.request("/api/auth/sign-up/email", {
		body: JSON.stringify({ password: VALID_PASSWORD, username }),
		headers: { "Content-Type": "application/json", Origin: WEB_ORIGIN },
		method: "POST",
	});
	expect(res.status).toBe(200);
	return res.headers
		.getSetCookie()
		.map((cookie) => cookie.split(";")[0])
		.join("; ");
};

const getPrivateData = (cookie?: string) =>
	app.request("/trpc/privateData", {
		headers: cookie ? { Cookie: cookie } : {},
	});

describe("privateData", () => {
	it("rejects requests without a session", async () => {
		const res = await getPrivateData();

		expect(res.status).toBe(401);
	});

	it("returns the username as entered at sign-up for a valid session", async () => {
		const username = uniqueUsername("Kate");
		const cookie = await signUpWithSession(username);

		const res = await getPrivateData(cookie);

		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			result: { data: { username: string } };
		};
		expect(body.result.data.username).toBe(username);
	});

	it("rejects the old cookie after sign-out", async () => {
		const cookie = await signUpWithSession(uniqueUsername("Liam"));

		const signOut = await app.request("/api/auth/sign-out", {
			headers: { Cookie: cookie, Origin: WEB_ORIGIN },
			method: "POST",
		});
		expect(signOut.status).toBe(200);

		const res = await getPrivateData(cookie);
		expect(res.status).toBe(401);
	});

	it("rejects an expired session", async () => {
		const username = uniqueUsername("Mona");
		const cookie = await signUpWithSession(username);
		await db.session.updateMany({
			data: { expiresAt: new Date(Date.now() - ONE_MINUTE_MS) },
			where: { user: { username: username.toLowerCase() } },
		});

		const res = await getPrivateData(cookie);

		expect(res.status).toBe(401);
	});
});
