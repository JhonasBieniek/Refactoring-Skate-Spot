import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from "./core/guards/auth.guard";
import { BaseComponent } from './pages/base/base/base.component';

const routes: Routes = [
  {
    path: '', loadChildren: () => import('./pages/base/base.module').then(m => m.BaseModule)
  },
  {
    path: 'spot',loadChildren: () => import('./pages/spot/spot.module').then(m => m.SpotModule)
  },
  // {
  //   path: 'cam',loadChildren: () => import('./pages/cam/cam.module').then(m => m.CamModule)
  // },
  {
    path: 'skater',loadChildren: () => import('./pages/skaters/skaters.module').then(m => m.SkatersModule)
  },
  {path: '404', component: BaseComponent},
  {path: '**', redirectTo: '/'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
