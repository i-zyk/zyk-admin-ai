"use client";

import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function AuthForms() {
	const [showSignIn, setShowSignIn] = useState(true);

	const showSignUpForm = () => setShowSignIn(false);
	const showSignInForm = () => setShowSignIn(true);

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={showSignUpForm} />
	) : (
		<SignUpForm onSwitchToSignIn={showSignInForm} />
	);
}
