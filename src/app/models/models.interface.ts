export interface UidUser {
    sUid: number | null;
}

export interface UsuarioI {
    sUid: number;
    sNomUsuario: string;
    sPwd: string;
    fchNacimiento: string;
    sEmail: string;
    sCelular : string;
    sEdad: number;
    sTipo: string;
    sGenero: string;
}

export interface LoginI {
    sEmail: string;
    sPwd: string;
}

export interface Cliente {
    iD_USUARIO: number,
    nombrE_USUARIO: string,
    fechA_NACIMIENTO: string,
    edad: number,
    correo: string,
    celular: string,
    genero: string,
    nacionalidad: number,
    medidas: string,
    altura: string,
    peso: number,
    horariO_ATENCION: number,
    horariO_PART_TIME: string,
    ciudad: number,
    comuna: number,
    metro: number,
    valor: number,
    colorojos: number,
    colorcabello: number,
    biotipo: number,
    descripcion: string,
    estado: string,
    tipo: string,
    fechA_CREACION: string,
    fechA_ACTIVACION: string,
    fotO_PERFIL: string

}

export interface ImageProfile {
    photoprofile: File
}

export interface MediaFiles {
    iId: number,
    iUid: number,
    sNomMediaFile: string,
    sMediaType: string,
    sThumbnial: string
}

export interface objId {
    iId: number
}

export interface Publications {
    iPUBLICACION: number,
    iUSUARIO: number,
    sCOMENTARIO: string,
    sNOMMEDIA: string,
    sMEDIATYPE: string,
    sTHUMBNAIL: string,
    dFECHA: string
}

export interface PublicationForm {
    sUid: number,
    pageIndex: number,
    pageSize: number
}

export interface Stories {
    iHistoria: number,
    iUsuario: number,
    sNomMedia: string,
    sMediaType: string,
    sThumbnail: string,
    dFecha: string
}

export interface Story {
  id: number;
  userid: number;
  url: string;
  thumbnailUrl : string;
  type: 'image' | 'video';
  fecha: string;
  isActive: boolean;
}

export interface StoriesHome {
    iD_HISTORIA: number,
    iD_USUARIO: number,
    noM_MEDIA: string,
    mediA_TYPE: string,
    fecha: string,
    thumbnail: string,
    nomUsuario: string,
    fotoPerfilUsuario: string

}

export interface ActiveProfile {
    Uid: string,
    estado: string
}

export interface Valoracion {
    iD_VALORACION: number;
    iD_USUARIO: number;
    tT_UNA_ESTRELLA: number;
    tT_DOS_ESTRELLAS: number;
    tT_TRES_ESTRELLAS: number;
    tT_CUATRO_ESTRELLAS: number;
    tT_CINCO_ESTRELLAS: number;
    valoracion: string;
    fecha: string
}

export interface Reviews {
    idReview: number;
    comentario: string;
    fecha: string;
    nota: number;
    idUsuario: number;
    idUsuarioReview: number;
    nombreUsuarioReview: string;
    fotoPerfilReview: string;
    oldnota: number;
}

export interface idUsersReview {
    sIdUser: number | null;
    sIdUserEval: number | null;
}

export interface LastValReviewUser {
    iD_REVIEW: number;
    iD_USUARIO: number;
    comentario: string;
    fecha: string;
    nota: number;
    iD_USUARIO_REVIEW: number;
    usuarioReview: string;
}

export interface rRefreshToken {
    sToken: string;
}

export interface IDHISTORIA {
    nIDHISTORIA: number | null;
    bESTADO: boolean;
}

export interface ContactMail {
    email: string;
    description: string;
}

export interface WelcomeMail {
    name: string;
    email: string;
    type: string;
}

export interface ClaveMail {
    email: string;
}

export interface ChangePassword{
    sPwd : string;
}