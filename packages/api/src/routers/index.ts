import { toDisplayUsername } from "@zyk-admin-ai/auth/username";

import { protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	// Returns only the display name; the user record carries a placeholder email.
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		username: toDisplayUsername(ctx.session.user),
	})),
});
export type AppRouter = typeof appRouter;
