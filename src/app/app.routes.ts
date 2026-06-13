import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Account } from './account/account';
import { Profile } from './profile/profile';
import { Settingaccount } from './settingaccount/settingaccount';
import { Pagenotfound } from './pagenotfound/pagenotfound';
import { Authkeys } from './authkeys/authkeys';
import { ManageProfile } from './manage-profile/manage-profile';

export const routes: Routes = [
    {path:'', redirectTo:'/home', pathMatch:'full'},
    {path:'home', component:Home},
    {path:'login', component:Login},
    {path:'authkeys', component:Authkeys},
    {path:'account/:typeuser', component:Account},
    {path:'profile', component:Profile},
    {path:'profile/:sUid/:sLug', component:Profile},
    {path:'settingaccount', component: Settingaccount},
    {path:'manage-profile', component: ManageProfile},
    {path:'404', component:Pagenotfound},
    {path:'**', redirectTo:'/404'}
];