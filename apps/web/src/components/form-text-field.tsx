import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@zyk-admin-ai/ui/components/input";
import { Label } from "@zyk-admin-ai/ui/components/label";
import type { ChangeEvent } from "react";

interface FormTextFieldProps {
	autoComplete: string;
	field: AnyFieldApi;
	label: string;
	type?: "text" | "password";
}

export default function FormTextField({
	autoComplete,
	field,
	label,
	type = "text",
}: FormTextFieldProps) {
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		field.handleChange(event.target.value);
	};

	return (
		<div className="space-y-2">
			<Label htmlFor={field.name}>{label}</Label>
			<Input
				aria-invalid={field.state.meta.errors.length > 0}
				autoComplete={autoComplete}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={handleChange}
				type={type}
				value={field.state.value}
			/>
			{field.state.meta.errors.map((error) => (
				<p className="text-red-500" key={error?.message}>
					{error?.message}
				</p>
			))}
		</div>
	);
}
