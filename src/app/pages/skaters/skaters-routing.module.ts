import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/shared/guards/auth.guard';
import { FriendListComponent } from './friend-list/friend-list.component';
import { SkaterViewComponent } from './skater-view/skater-view.component';
import { SkaterComponent } from './skater/skater.component';

const routes: Routes = [
    {
        path: '', canActivate: [AuthGuard], component: SkaterComponent
    },
    {
        path: 'friends', canActivate: [AuthGuard], component: FriendListComponent
    },
    {
        path: 'view/:id', component: SkaterViewComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SkatersRoutingModule { }
