import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { BehaviorSubject, catchError, switchMap, throwError } from "rxjs";
import { ApiServices } from "../api/api.service";
import { ResponseI } from "../models/response.interface";
import { Router } from '@angular/router';
import { MethodService } from "../method/method.service";

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jtwInterceptor: HttpInterceptorFn = (req, next) => {

    const router = inject(Router);
    const methodservice = inject(MethodService);

    if (req.url.includes('/Authentication') || req.url.includes('/RefreshToken')) {
        return next(req);
    }

    if (typeof localStorage !== 'undefined') {
        const api = inject(ApiServices);
        const sToken = localStorage.getItem('cl.paramours.token');

        const cloneReq = req.clone({
            setHeaders: {
                Authorization: "Bearer " + sToken
            }
        });

        return next(cloneReq).pipe(
            catchError((error: HttpErrorResponse) => {
                console.log('Error status code jtwInterceptor : ' + error.status);
                if (error.status === 401) {
                    return api.GetRefreshToken({ sToken: localStorage.getItem('cl.paramours.refreshToken')! }).pipe(
                        switchMap((res: ResponseI) => {
                            methodservice.setItemLocalStorage("cl.paramours.token", res.token);
                            methodservice.setItemLocalStorage("cl.paramours.refreshToken", res.refreshToken);

                            return next(
                                req.clone({
                                    setHeaders: { Authorization: "Bearer " + res.token }
                                })
                            );

                        }), catchError(err => {
                            console.log('Err status  jtwInterceptor : ' + err.status);
                            methodservice.delUserLocalStorage();
                            //methodservice.tShowMenu.emit(false);
                            router.navigate(['/home']);
                            return throwError(() => err);
                        })
                    );
                } else {
                    console.log('error status  jtwInterceptor : ' + error.status);
                    return throwError(() => error);
                }
            })
        );
    }
    else {
        return next(req);
    }
};