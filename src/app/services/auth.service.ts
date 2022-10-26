import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { filter, firstValueFrom, Observable, tap, timeout } from 'rxjs';
import { TokenService } from './token.service';

const AUTH_API = 'https://wordgameapi.mikebillings.com/api/v2/auth';

// Timeout for remote calls
const HTTP_TIMEOUT: number = 5000;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

export interface LoginResult {
    access_token: string,
    token_type: string,
    expires_in: number,
    refresh_token: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    constructor(private http: HttpClient, private tokenStorage: TokenService) { }

    // Register
    async register(email: string, password: string): Promise<HttpResponse<LoginResult>> {
        return this.__loginOrRegister(email, password, '/register');
    }

    // Login
    async login(email: string, password: string): Promise<HttpResponse<LoginResult>> {
        return this.__loginOrRegister(email, password, '/login');
    }

    // Login & register have the same API
    private async __loginOrRegister(email: string, password: string, path: string): Promise<HttpResponse<LoginResult>> {
        const body = {
            email: email,
            password: password
        };
        console.log('Authservice Login: ' + JSON.stringify(body));

        return await firstValueFrom(
            this.http.post<LoginResult>(
                AUTH_API + path,
                body,
                { observe: 'response' }
            ).pipe(
                timeout(HTTP_TIMEOUT),
                filter(event => event instanceof HttpResponse),
                tap<HttpResponse<LoginResult>>(
                    response => {
                        if (response.status == 200) {
                            // this._lastExecutionTime = parseFloat(response.headers.get('ExecutionTime'));
                            // console.log("exec time:", this._lastExecutionTime);
                            let loginResult: LoginResult = response.body;
console.log("Authservice: saving new tokens");
                            this.tokenStorage.token = loginResult.access_token;
                            this.tokenStorage.refreshToken = loginResult.refresh_token;
                            this.tokenStorage.email = email;
                        }
                    }
                )
            )
        );
    }

    // Refresh token
    refreshToken(token: string) {
        return this.http.post(AUTH_API + 'refresh', {
            refreshToken: token
        }, httpOptions);
    }
}
