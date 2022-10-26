import { HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

import { TokenService } from './token.service';
import { AuthService } from './auth.service';

import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor implements HttpInterceptor {
    private isRefreshing = false;

    constructor(private tokenService: TokenService, private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<Object>> {
        return next.handle(req).pipe(
            tap((httpEvent: HttpEvent<any>) =>{
                if (httpEvent instanceof HttpResponse) {
                    if (httpEvent.headers.has('ExecutionTime')) {
                        this.tokenService.lastAPIExecutionTime = Number(httpEvent.headers.get('ExecutionTime'));
                    }
                }
            })
        );
    }
}
