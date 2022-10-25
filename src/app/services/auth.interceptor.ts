import { HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

import { TokenService } from './token.service';
import { AuthService } from './auth.service';

import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;

    constructor(private tokenService: TokenService, private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<Object>> {
        // Put the access token onto each outgoing http request
        let authReq = req;
        const token = this.tokenService.token;
        if (token != null) {
            authReq = this.addAccessTokenHeader(req, token);
        }

        // Watch responses for 400 statuses.  If you find one, refresh the token and try again.
        return next.handle(authReq).pipe(
            catchError(error => {
                // 400 is returned when an access token is no good
                if (error instanceof HttpErrorResponse && error.status === 400) {
                    return this.refreshToken(authReq, next);
                }

                return throwError(() => error);
            })
        );
    }

    private refreshToken(request: HttpRequest<any>, next: HttpHandler) {
        if (!this.isRefreshing) {
            this.isRefreshing = true;

            const token = this.tokenService.refreshToken;

            if (token) {
                return this.authService.refreshToken(token).pipe(
                    switchMap((token: any) => {
                        this.isRefreshing = false;

                        this.tokenService.token = token.access_token;
                        this.tokenService.refreshToken = token.refresh_token;

                        return next.handle(this.addAccessTokenHeader(request, token.access_token));
                    }),
                    catchError((err) => {
                        this.isRefreshing = false;

                        // this.tokenService.signOut();
                        return throwError(() => err);
                    })
                );
            }
        }
    }

    private addAccessTokenHeader(request: HttpRequest<any>, token: string) {
        return request.clone({ headers: request.headers.set('Authorization', 'Bearer ' + token) });
    }
}
