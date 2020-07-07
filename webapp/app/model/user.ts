export class User {
	email: string;
	username: string;
	password: string;
}

export class RegisterUser extends User {
	password_confirmation: string;
}

export class ResetPwd extends RegisterUser {
	token: string;
}
