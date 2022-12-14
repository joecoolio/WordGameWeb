import { Injectable } from '@angular/core';
import { EventBusService } from './eventbus.service';

const TOKEN_KEY = 'auth-token';
const REFRESHTOKEN_KEY = 'auth-refreshtoken';
const USER_KEY = 'auth-user';

// Sends: 
// Receives: doLogout, forgetAuthTokens
@Injectable({
  providedIn: 'root'
})
export class TokenService {
    constructor(private eventBusService: EventBusService) {

        // Watch for logout events and wipe the stored tokens
        this.eventBusService.onCommand('doLogout', () => {
            console.log("TokenService: logout requested");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESHTOKEN_KEY);
        });

        // Watch for logout events and wipe the stored tokens
        this.eventBusService.onCommand('forgetAuthTokens', () => {
            console.log("TokenService: forget tokens requested");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESHTOKEN_KEY);
        });
    }

    private _lastAPIExecutionTime: number;

    public get isLoggedIn(): boolean {
        return this.refreshToken != null;
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
        return JSON.parse(localStorage.getItem(USER_KEY));
    }

    public get lastAPIExecutionTime(): number {
        return this._lastAPIExecutionTime;
    }
    public set lastAPIExecutionTime(value: number) {
        this._lastAPIExecutionTime = value;
    }
}
