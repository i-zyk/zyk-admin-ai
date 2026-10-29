import { toDisplayUsername } from "@zyk-admin-ai/auth/username";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/session";

import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
	const user = await getSessionUser();
	if (!user) {
		redirect("/login");
	}

	return (
		<main className="mx-auto mt-10 w-full max-w-md space-y-6 p-6">
			<h1 className="font-bold text-3xl">首页</h1>
			<p>
				欢迎，<span className="font-medium">{toDisplayUsername(user)}</span>
			</p>
			<SignOutButton />
		</main>
	);
}
