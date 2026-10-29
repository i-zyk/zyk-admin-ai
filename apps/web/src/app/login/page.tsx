import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/session";

import AuthForms from "./auth-forms";

export default async function LoginPage() {
	if (await getSessionUser()) {
		redirect("/dashboard");
	}

	return <AuthForms />;
}
