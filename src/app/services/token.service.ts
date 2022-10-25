import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth-token';
const REFRESHTOKEN_KEY = 'auth-refreshtoken';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
    constructor() { }

    signOut(): void {
        localStorage.clear();
    }

    public set token(value: string) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.setItem(TOKEN_KEY, value);
    }

    public get token(): string {
        return localStorage.getItem(TOKEN_KEY);
    }

    public set refreshToken(value: string) {
        localStorage.removeItem(REFRESHTOKEN_KEY);
        localStorage.setItem(REFRESHTOKEN_KEY, value);
    }

    public get refreshToken(): string {
        return localStorage.getItem(REFRESHTOKEN_KEY);
    }

    public set email(email: string) {
        localStorage.removeItem(USER_KEY);
        localStorage.setItem(USER_KEY, JSON.stringify(email));
    }

    public get email(): string {
        return localStorage.getItem(USER_KEY);
    }
}
