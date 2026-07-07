import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Cliente, LoginI, objId, PublicationForm, Publications, UidUser, UsuarioI, ActiveProfile, Reviews, rRefreshToken, IDHISTORIA, ContactMail, WelcomeMail, ClaveMail, Story, ChangePassword, idUsersReview } from "../models/models.interface";
import { ResponseClient, ResponseI, ResponseMediaFiles, ResponseMsg, rPublications, rReview, rStories, rStoriesHome, rStory, rValLastReview, rValoracion } from "../models/response.interface";

@Injectable({providedIn: 'root'})
export class ApiServices{
    private sSiteUrl = "http://10.211.55.92";
    //private sSiteUrl = "http://192.168.1.82";
    private readonly _http = inject(HttpClient);

    GetManageProfile():Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/GetManageProfile";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/GetManageProfile";
        return this._http.get<ResponseClient>(cUrl);
    }

    getClients():Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/GetClients";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/GetClients";
        return this._http.get<ResponseClient>(cUrl);
    }

    postRegistro(form:UsuarioI):Observable<ResponseI>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/Post";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/Post";
        return this._http.post<ResponseI>(cUrl, form);
    }

    postLogin(form:LoginI):Observable<ResponseI>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Login/Authentication"
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Login/Authentication";
        return this._http.post<ResponseI>(cUrl, form);
    }

    getClientByToken():Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/GetClientByToken"
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/GetClientByToken";
        return this._http.get<ResponseClient>(cUrl);
    }

    getClientById(form:UidUser):Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/ClientById";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/ClientById";
        return this._http.post<ResponseClient>(cUrl, form);
    }

    updateClient(form:Cliente):Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/Update";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/Update";
        return this._http.post<ResponseClient>(cUrl, form);
    }

    ActiveProfile(form:ActiveProfile):Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/ActiveProfile";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/ActiveProfile";
        return this._http.post<ResponseClient>(cUrl, form);
    }

    ChangeStateProfile(form:ActiveProfile):Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/ChangeStateProfile";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/ChangeStateProfile";
        return this._http.post<ResponseClient>(cUrl, form);
    }

    CheckIDUsuarioByClient(form:FormData):Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/CheckIDUsuarioByClient";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/CheckIDUsuarioByClient";
        return this._http.post<ResponseClient>(cUrl, form);
    }

    updateLoadPhotoProfile(form:FormData):Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/LoadPhotoProfile";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/LoadPhotoProfile";
        return this._http.post<ResponseClient>(cUrl, form);
    }

    ChangePasswordProfile(form:ChangePassword):Observable<ResponseClient>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Client/LoadPhotoProfile";
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Client/ChangePasswordProfile";
        return this._http.post<ResponseClient>(cUrl, form);
    }

    GetRefreshToken(form:rRefreshToken):Observable<ResponseI>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.client/api/v1/Login/RefreshToken"
        let cUrl = "https://cl.api.client.paramours.cl/api/v1/Login/RefreshToken";
        return this._http.post<ResponseI>(cUrl, form);
    }

    updateLoadMediaFiles(form:FormData):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.mediafiles/api/v1/File/UploadMediaFiles";
        let cUrl = "https://cl.api.mediafiles.paramours.cl/api/v1/File/UploadMediaFiles";
        return this._http.post<ResponseMsg>(cUrl, form);
    }

    getMediaFiles(form:UidUser):Observable<ResponseMediaFiles>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.mediafiles/api/v1/File/GetPhotosById";
        let cUrl = "https://cl.api.mediafiles.paramours.cl/api/v1/File/GetPhotosById";
        return this._http.post<ResponseMediaFiles>(cUrl, form);
    }

    DeleteFile(form:objId):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.mediafiles/api/v1/File/DeleteFileId";
        let cUrl = "https://cl.api.mediafiles.paramours.cl/api/v1/File/DeleteFileId";
        return this._http.post<ResponseMsg>(cUrl, form);
    }

    addPublication(form:FormData):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.contents/api/v1/Publications/AddPublication";
        let cUrl = "https://cl.api.contents.paramours.cl/api/v1/Publications/AddPublication";
        return this._http.post<ResponseMsg>(cUrl, form);
    }

    getPaginationPublicationsById(form:PublicationForm):Observable<rPublications>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.contents/api/v1/Publications/GetPostPaginationById";
        let cUrl = "https://cl.api.contents.paramours.cl/api/v1/Publications/GetPostPaginationById";
        return this._http.post<rPublications>(cUrl, form);
    }

    DeletePublication(form:objId):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.contents/api/v1/Publications/DelPublicationById";
        let cUrl = "https://cl.api.contents.paramours.cl/api/v1/Publications/DelPublicationById";
        return this._http.post<ResponseMsg>(cUrl, form);
    }

    getPublicationsById(form:UidUser):Observable<rPublications>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.contents/api/v1/Publications/GetPublicationsById";
        let cUrl = "https://cl.api.contents.paramours.cl/api/v1/Publications/GetPublicationsById";
        return this._http.post<rPublications>(cUrl, form);
    }

    addStories(form:FormData):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.stories/api/v1/Stories/addStories";
        let cUrl = "https://cl.api.stories.paramours.cl/api/v1/Stories/addStories";
        return this._http.post<ResponseMsg>(cUrl, form);
    }

    getStoriesById(form:UidUser):Observable<rStories>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.stories/api/v1/Stories/GetStoriesById";
        let cUrl = "https://cl.api.stories.paramours.cl/api/v1/Stories/GetStoriesById";
        return this._http.post<rStories>(cUrl, form);
    }

    GetStories():Observable<rStory>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.stories/api/v1/Stories/GetStories";
        let cUrl = "https://cl.api.stories.paramours.cl/api/v1/Stories/GetStories";
        return this._http.get<rStory>(cUrl);
    }

    GetAllActiveStoriesUser():Observable<rStoriesHome>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.stories/api/v1/Stories/GetAllActiveStoriesUser";
        let cUrl = "https://cl.api.stories.paramours.cl/api/v1/Stories/GetAllActiveStoriesUser";
        return this._http.get<rStoriesHome>(cUrl);
    }
    
    ActiveStories(form:IDHISTORIA):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.stories/api/v1/Stories/ActiveStories";
        let cUrl = "https://cl.api.stories.paramours.cl/api/v1/Stories/ActiveStories";
        return this._http.post<ResponseMsg>(cUrl, form);
    }

    GetCountReviewByUser(form:UidUser):Observable<number>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.reviews/api/v1/Review/GetCountReviewByUser";
        let cUrl = "https://cl.api.reviews.paramours.cl/api/v1/Review/GetCountReviewByUser";
        return this._http.post<number>(cUrl, form);
    }

    GetValReviewById(form:UidUser):Observable<rValoracion>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.reviews/api/v1/Review/GetValReviewById";
        let cUrl = "https://cl.api.reviews.paramours.cl/api/v1/Review/GetValReviewById";
        return this._http.post<rValoracion>(cUrl, form);
    }

    GetReviewByIduser(form:PublicationForm):Observable<rReview>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.reviews/api/v1/Review/GetReviewByIduser";
        let cUrl = "https://cl.api.reviews.paramours.cl/api/v1/Review/GetReviewByIduser";
        return this._http.post<rReview>(cUrl, form);
    }

    GetLastValReviewUser(form:idUsersReview):Observable<rValLastReview>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.reviews/api/v1/Review/GetLastValReviewUser";
        let cUrl = "https://cl.api.reviews.paramours.cl/api/v1/Review/GetLastValReviewUser";
        return this._http.post<rValLastReview>(cUrl, form);
    }

    AddReview(form:Reviews):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.reviews/api/v1/Review/AddReview";
        let cUrl = "https://cl.api.reviews.paramours.cl/api/v1/Review/AddReview";
        return this._http.post<ResponseMsg>(cUrl, form);
    }

    ClietContact(form:ContactMail):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.mails/api/v1/Mails/ClientContact";
        let cUrl = "https://cl.api.mails.paramours.cl/api/v1/Mails/ClientContact";
        return this._http.post<ResponseI>(cUrl, form);
    }

    WelcomeContact(form:WelcomeMail):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.mails/api/v1/Mails/WelcomeContact";
        let cUrl = "https://cl.api.mails.paramours.cl/api/v1/Mails/WelcomeContact";
        return this._http.post<ResponseI>(cUrl, form);
    }

    RecoveryPassword(form:ClaveMail):Observable<ResponseMsg>{
        //let cUrl = this.sSiteUrl + "/cl.api.paramours.mails/api/v1/Mails/AuthRecovery";
        let cUrl = "https://cl.api.mails.paramours.cl/api/v1/Mails/AuthRecovery";
        return this._http.post<ResponseI>(cUrl, form);
    }

    getCiudades():Observable<any>{
        let cUrl = "/assets/data/ciudades.json";
        return this._http.get<any>(cUrl);
    }

    getComunas():Observable<any>{
        let cUrl = "/assets/data/comunas.json";
        return this._http.get<any>(cUrl);
    }

    getMetros():Observable<any>{
        let cUrl = "/assets/data/metros.json";
        return this._http.get<any>(cUrl);
    }

    getNaciones():Observable<any>{
        let cUrl = "/assets/data/nacionalidades.json";
        return this._http.get<any>(cUrl);
    }

    getGeneros():Observable<any>{
        let cUrl = "/assets/data/generos.json";
        return this._http.get<any>(cUrl);
    }

    getColorOjos():Observable<any>{
        let cUrl = "/assets/data/colorojos.json";
        return this._http.get<any>(cUrl);
    }

    getColorCabello():Observable<any>{
        let cUrl = "/assets/data/colorcabello.json";
        return this._http.get<any>(cUrl);
    }

    getBiotipo():Observable<any>{
        let cUrl = "/assets/data/biotipo.json";
        return this._http.get<any>(cUrl);
    }
}