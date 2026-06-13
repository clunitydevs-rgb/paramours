import { Cliente, LastValReviewUser, MediaFiles, Publications, Reviews, Stories, StoriesHome, Story, Valoracion } from "./models.interface";

export interface ResponseI {
    token: string;
    sUid: string;
    sLug: string;
    sFotoPerfl: string;
    expiresin: string;
    refreshToken: string;
    typeU: string;
    message: string;
    ncoderror: string;
}

export interface ResponseClient {
    oClient: Cliente;
    message: string;
    ncoderror: string;
}

export interface ResponseMediaFiles {
    oMediaFiles: MediaFiles;
    message: string;
    ncoderror: string;
}

export interface ResponseMsg {
    message: string;
    ncoderror: string;
}

export interface rPublications {
    post: Publications;
    pageIndex: number;
    totalPages: number;
    message: string;
    ncoderror: string;
}

export interface rStories {
    oStories: Stories;
    message: string;
    ncoderror: string;
}

export interface rStoriesHome {
    oStories: StoriesHome[];
    message: string;
    ncoderror: string;
}

export interface rStory {
    oStories: Story[];
    message: string;
    ncoderror: string;
}

export interface rValoracion {
    oValReview : Valoracion;
    message: string;
    ncoderror: string;
}

export interface rReview {
    oReview: Reviews;
    pageIndex: number;
    totalPages: number;
    message: string;
    ncoderror: string;
}

export interface rValLastReview {
    oValReview: LastValReviewUser;
    message: string;
    ncoderror: string;
}