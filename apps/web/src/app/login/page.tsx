import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import AuthForms from "./auth-forms";

// An unreachable auth server is treated as signed out so the form still renders.
async function hasActiveSession(): Promise<boolean> {
	try {
		const { data } = await authClient.getSession({
			fetchOptions: { headers: await headers() },
		});
		return Boolean(data?.user);
	} catch {
		return false;
	}
}

export default async function LoginPage() {
	if (await hasActiveSession()) {
		redirect("/dashboard");
	}

	return <AuthForms />;
}
