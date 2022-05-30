import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/shared/guards/auth.guard';
import { SpotEditComponent } from './spot-edit/spot-edit.component';
import { SpotViewComponent } from './spot-view/spot-view.component';
import { SpotComponent } from './spot.component';

const routes: Routes = [
  {
    path: '', canActivate: [AuthGuard], component: SpotComponent
  },
  {
    path: 'spot', canActivate: [AuthGuard], component: SpotComponent
  },
  {
    path: 'view/:id', component: SpotViewComponent
  },
  {
    path: 'edit/:id', canActivate: [AuthGuard], component: SpotEditComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SpotRoutingModule { }
