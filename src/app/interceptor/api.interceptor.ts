import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { NgxSpinnerService } from "ngx-spinner";
import { finalize, Observable } from "rxjs";


@Injectable()
export class ApiInterceptor implements HttpInterceptor{
    constructor(private spinner: NgxSpinnerService) {}
    private _activeRequest = 0;

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const skipLoader = req.url.includes('/Client/GetClients')
            || req.url.includes('/Stories/GetAllActiveStoriesUser');

        if (skipLoader) {
            return next.handle(req);
        }

        if (this._activeRequest === 0){
            this.spinner.show();
        }

        this._activeRequest++;
        /*this.spinner.show();
        setTimeout(() => {
            this.spinner.hide();
        }, 5000);*/
        
        return next.handle(req).pipe(finalize(() => this.StopLoader()));
    }

    private StopLoader(){
        this._activeRequest--;
        if (this._activeRequest === 0){
           this.spinner.hide();
        }
    }
}
