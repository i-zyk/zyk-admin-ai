import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * False during SSR and hydration, true once React has taken over the page.
 * Forms use it to block native submissions (which would put credentials in
 * the URL) before their submit handlers are attached.
 */
export const useHydrated = (): boolean =>
	useSyncExternalStore(
		subscribe,
		() => true,
		() => false
	);
