import { useForm } from "@tanstack/react-form";
import { AUTH_MESSAGES, signUpSchema } from "@zyk-admin-ai/auth/username";
import { Button } from "@zyk-admin-ai/ui/components/button";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { signUpErrorMessage } from "@/lib/auth-errors";
import { useHydrated } from "@/lib/use-hydrated";

import FormTextField from "./form-text-field";

const selectSubmitState = (state: {
	canSubmit: boolean;
	isSubmitting: boolean;
}) => ({
	canSubmit: state.canSubmit,
	isSubmitting: state.isSubmitting,
});

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();
	const isHydrated = useHydrated();

	const form = useForm({
		defaultValues: {
			password: "",
			username: "",
		},
		onSubmit: async ({ value }) => {
			let result: Awaited<ReturnType<typeof authClient.signUp.email>>;
			try {
				// email and name are derived from the username on the server.
				result = await authClient.signUp.email({
					email: "",
					name: "",
					password: value.password,
					username: value.username.trim(),
				});
			} catch {
				toast.error(AUTH_MESSAGES.networkError);
				return;
			}
			if (result.error) {
				toast.error(signUpErrorMessage(result.error));
				return;
			}
			toast.success("注册成功");
			router.push("/dashboard");
		},
		validators: {
			onSubmit: signUpSchema,
		},
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();
		form.handleSubmit();
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">创建账号</h1>

			<form className="space-y-4" noValidate onSubmit={handleSubmit}>
				<form.Field name="username">
					{(field) => (
						<FormTextField
							autoComplete="username"
							field={field}
							label="用户名"
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<FormTextField
							autoComplete="new-password"
							field={field}
							label="密码"
							type="password"
						/>
					)}
				</form.Field>

				<form.Subscribe selector={selectSubmitState}>
					{({ canSubmit, isSubmitting }) => (
						<Button
							className="w-full"
							disabled={!(isHydrated && canSubmit) || isSubmitting}
							type="submit"
						>
							{isSubmitting ? "注册中..." : "注册"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button
					className="text-indigo-600 hover:text-indigo-800"
					onClick={onSwitchToSignIn}
					variant="link"
				>
					已有账号？去登录
				</Button>
			</div>
		</div>
	);
}
