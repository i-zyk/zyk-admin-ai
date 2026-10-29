import { AUTH_MESSAGES } from "@zyk-admin-ai/auth/username";

interface AuthClientError {
	code?: string;
}

const SIGN_UP_ERROR_MESSAGES: Record<string, string> = {
	INVALID_USERNAME: AUTH_MESSAGES.usernameFormat,
	PASSWORD_TOO_SHORT: AUTH_MESSAGES.passwordTooShort,
	USER_ALREADY_EXISTS: AUTH_MESSAGES.usernameTaken,
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: AUTH_MESSAGES.usernameTaken,
	USERNAME_IS_ALREADY_TAKEN: AUTH_MESSAGES.usernameTaken,
	USERNAME_REQUIRED: AUTH_MESSAGES.usernameRequired,
	USERNAME_TOO_LONG: AUTH_MESSAGES.usernameLength,
	USERNAME_TOO_SHORT: AUTH_MESSAGES.usernameLength,
};

export const signUpErrorMessage = (error: AuthClientError): string =>
	(error.code && SIGN_UP_ERROR_MESSAGES[error.code]) ||
	AUTH_MESSAGES.signUpFailed;
