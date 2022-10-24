// @Injectable({
//   providedIn: 'root'
// })
// export class InterceptorService implements HttpInterceptor {
// //   tokens = JSON.parse(localStorage.getItem('tokens'));

//   constructor(private _router: Router) {}

//   intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

//     const cloned = request.clone({
//     //   setHeaders: {
//     //     Authorization: `Bearer ${this.tokens.token} ${this.tokens.refreshToken}`
//     //   }
//     });

//     return next.handle(cloned).pipe(tap(
//         (evt) => {
//             if (evt instanceof HttpResponse) {
//                 const newTokens = evt.headers.get('Authorization');
//                 console.log(newTokens);
//             }
//         },
//         err => {
//             console.log(err);
//             sessionStorage.removeItem('currentUser');
//             this._router.navigate(['']);
//         }
//     ));
//   }

// }


import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse} from '@angular/common/http';
import { filter, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let $jwt:string = localStorage.getItem('jwt');

    if ($jwt != null) {
        req = req.clone({
          setHeaders: {
            'Authorization': $jwt
          }
        });
    }
    return next.handle(req);

    // // Add 'expose headers' headers to reponses
    // return next.handle(modifiedRequest).pipe(
    //     filter(event => event instanceof HttpResponse),
    //     tap<HttpResponse<any>>(
    //         response => {
    //             // response.headers.append("Access-Control-Expose-Headers", "Authorization, ExecutionTime");
    //         }
    //     ),
    // );
  }
}