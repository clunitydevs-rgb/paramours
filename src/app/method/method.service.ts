import { EventEmitter, Injectable, Output } from "@angular/core";
import { MediaFiles, StoriesHome } from "../models/models.interface";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class MethodService {
    @Output() tMediaFiles = new EventEmitter<MediaFiles>();
    @Output() tStoriesHome = new EventEmitter<StoriesHome[]>();
    @Output() tInProcess: EventEmitter<string> = new EventEmitter();

    private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
    isLoggedIn$ = this.isLoggedInSubject.asObservable();

    isLogin() {
        this.isLoggedInSubject.next(true);
    }

    setItemLocalStorage(sNameParam: string, sDataParam: string) {
        if (typeof localStorage !== 'undefined')
            localStorage.setItem(sNameParam, sDataParam);
    }

    getItemLocalStorage(sNameParam: string) {
        let sToken: string = "";
        if (typeof localStorage !== 'undefined') {
            sToken = localStorage.getItem(sNameParam)!;
        }
        return sToken;
    }

    setItemSessionStorage(sNameParam: string, sDataParam: string) {
        sessionStorage.setItem(sNameParam, sDataParam);
    }

    getItemSessionStorage(sNameParam: string) {
        let sToken: string = "";
        if (typeof sessionStorage !== 'undefined') {
            sToken = sessionStorage.getItem(sNameParam)!;
        }
        return sToken;
    }

    delItenSessionStorage(NameParam: string) {
        sessionStorage.removeItem(NameParam);
    }

    delItenLocalStorage(NameParam: string) {
        if (typeof localStorage !== 'undefined')
            localStorage.removeItem(NameParam);
    }

    delUserLocalStorage() {
        this.delItenLocalStorage('cl.paramours.token');
        this.delItenLocalStorage('cl.paramours.sUid');
        this.delItenLocalStorage('cl.paramours.refreshToken');
        this.delItenLocalStorage('cl.paramours.typeuser');
        this.delItenLocalStorage('cl.paramours.sFotoPerfl');
        this.isLoggedInSubject.next(false);
    }

    private hasToken(): boolean {
        return !!this.getItemLocalStorage('cl.paramours.token');
    }
}