import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { defer, finalize, Observable } from "rxjs";
import { LoadingService } from '../service/loading.service';
import { WEB_VISITS_REGISTER_URL } from '../api/web-visits.config';


@Injectable()
export class ApiInterceptor implements HttpInterceptor{
    constructor(private loading: LoadingService) {}

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const skipLoader = req.url === WEB_VISITS_REGISTER_URL
            || req.url.includes('/Client/GetClients')
            || req.url.includes('/Blog/')
            || req.url.includes('/Stories/GetAllActiveStoriesUser')
            || req.url.includes('/assets/data/');

        if (skipLoader) {
            return next.handle(req);
        }

        return defer(() => {
            const finish = this.loading.begin();
            return defer(() => next.handle(req)).pipe(finalize(finish));
        });
    }
}
