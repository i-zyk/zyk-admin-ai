import { AUTH_MESSAGES } from "@zyk-admin-ai/auth/username";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "./auth-client";

/** Signs out, then sends the user to /login; failures keep the session. */
export const useSignOut = () => {
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const signOut = async () => {
		if (isSigningOut) {
			return;
		}
		setIsSigningOut(true);
		try {
			const { error } = await authClient.signOut();
			if (error) {
				toast.error(AUTH_MESSAGES.signOutFailed);
				return;
			}
			router.replace("/login");
			router.refresh();
		} catch {
			toast.error(AUTH_MESSAGES.networkError);
		} finally {
			setIsSigningOut(false);
		}
	};

	return { isSigningOut, signOut };
};
