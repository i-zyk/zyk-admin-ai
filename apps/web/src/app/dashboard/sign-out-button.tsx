"use client";

import { Button } from "@zyk-admin-ai/ui/components/button";

import { useSignOut } from "@/lib/sign-out";

export default function SignOutButton() {
	const { isSigningOut, signOut } = useSignOut();

	return (
		<Button disabled={isSigningOut} onClick={signOut} variant="outline">
			{isSigningOut ? "退出中..." : "退出登录"}
		</Button>
	);
}
