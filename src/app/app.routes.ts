import { Routes } from '@angular/router';

export const routes: Routes = [
    {path:'', redirectTo:'/home', pathMatch:'full'},
    {path:'home', loadComponent: () => import('./home/home').then(m => m.Home)},
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
