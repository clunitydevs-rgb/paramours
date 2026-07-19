import { Routes } from '@angular/router';
import { escortLocationMatcher } from './routing/escort-location.matcher';

export const routes: Routes = [
    {path:'', redirectTo:'/home', pathMatch:'full'},
    {
        matcher: escortLocationMatcher,
        loadComponent: () => import('./escort-directory/escort-directory').then(m => m.EscortDirectory)
    },
    {path:'home', loadComponent: () => import('./home/home').then(m => m.Home)},
    {path:'terminos-y-condiciones', loadComponent: () => import('./public/terminos-condiciones/terminos-condiciones').then(m => m.TerminosCondiciones)},
    {path:'politica-de-privacidad', loadComponent: () => import('./public/politica-privacidad/politica-privacidad').then(m => m.PoliticaPrivacidad)},
    {path:'login', loadComponent: () => import('./login/login').then(m => m.Login)},
    {path:'authkeys', loadComponent: () => import('./authkeys/authkeys').then(m => m.Authkeys)},
    {path:'account/:typeuser', loadComponent: () => import('./account/account').then(m => m.Account)},
    {path:'profile', loadComponent: () => import('./profile/profile').then(m => m.Profile)},
    {path:'profile/:sUid/:sLug', loadComponent: () => import('./profile/profile').then(m => m.Profile)},
    {path:'settingaccount', loadComponent: () => import('./settingaccount/settingaccount').then(m => m.Settingaccount)},
    {path:'manage-profile', loadComponent: () => import('./manage-profile/manage-profile').then(m => m.ManageProfile)},
    {path:'404', loadComponent: () => import('./pagenotfound/pagenotfound').then(m => m.Pagenotfound)},
    {path:'**', redirectTo:'/404'}
];
