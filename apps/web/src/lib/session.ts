import { headers } from "next/headers";

import { authClient } from "./auth-client";

type SessionUser = NonNullable<
	Awaited<ReturnType<typeof authClient.getSession>>["data"]
>["user"];

/**
 * Reads the signed-in user for the current request in a Server Component.
 * An unreachable auth server counts as signed out.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
	try {
		const { data } = await authClient.getSession({
			fetchOptions: { headers: await headers() },
		});
		return data?.user ?? null;
	} catch {
		return null;
	}
}
