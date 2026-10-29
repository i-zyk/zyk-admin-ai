import { toDisplayUsername } from "@zyk-admin-ai/auth/username";
import { Button } from "@zyk-admin-ai/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@zyk-admin-ai/ui/components/dropdown-menu";
import { Skeleton } from "@zyk-admin-ai/ui/components/skeleton";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { useSignOut } from "@/lib/sign-out";

export default function UserMenu() {
	const { data: session, isPending } = authClient.useSession();
	const { isSigningOut, signOut } = useSignOut();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link href="/login">
				<Button variant="outline">登录</Button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" />}>
				{toDisplayUsername(session.user)}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>我的账号</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={isSigningOut}
						onClick={signOut}
						variant="destructive"
					>
						退出登录
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
