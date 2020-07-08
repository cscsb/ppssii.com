export class User {
    username: string;
    password: string;
}

export class RegisterUser extends User {
    password_confirmation: string;
    email: string;
}

export class ResetPwd extends RegisterUser{
    token: string;

}

