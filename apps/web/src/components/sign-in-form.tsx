import { useForm } from "@tanstack/react-form";
import { AUTH_MESSAGES, signInSchema } from "@zyk-admin-ai/auth/username";
import { Button } from "@zyk-admin-ai/ui/components/button";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { signInErrorMessage } from "@/lib/auth-errors";

import FormTextField from "./form-text-field";

const selectSubmitState = (state: {
	canSubmit: boolean;
	isSubmitting: boolean;
}) => ({
	canSubmit: state.canSubmit,
	isSubmitting: state.isSubmitting,
});

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			password: "",
			username: "",
		},
		onSubmit: async ({ value }) => {
			let result: Awaited<ReturnType<typeof authClient.signIn.username>>;
			try {
				result = await authClient.signIn.username({
					password: value.password,
					username: value.username.trim(),
				});
			} catch {
				toast.error(AUTH_MESSAGES.networkError);
				return;
			}
			if (result.error) {
				toast.error(signInErrorMessage(result.error));
				return;
			}
			toast.success("登录成功");
			router.push("/dashboard");
		},
		validators: {
			onSubmit: signInSchema,
		},
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();
		form.handleSubmit();
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">登录</h1>

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
							autoComplete="current-password"
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
							disabled={!canSubmit || isSubmitting}
							type="submit"
						>
							{isSubmitting ? "登录中..." : "登录"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button
					className="text-indigo-600 hover:text-indigo-800"
					onClick={onSwitchToSignUp}
					variant="link"
				>
					没有账号？去注册
				</Button>
			</div>
		</div>
	);
}
