import { protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	// Returns only the display name; the user record carries a placeholder email.
	privateData: protectedProcedure.query(({ ctx }) => {
		const { user } = ctx.session;
		return {
			message: "This is private",
			username: user.displayUsername ?? user.username ?? user.name,
		};
	}),
});
export type AppRouter = typeof appRouter;
