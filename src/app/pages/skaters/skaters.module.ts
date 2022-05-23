import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatChipsModule} from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SkaterComponent } from './skater/skater.component';
import { SkatersRoutingModule } from './skaters-routing.module';
import { SkaterViewComponent } from './skater-view/skater-view.component';
import { SigninComponent } from 'src/app/core/components/signin/signin.component';
import { FriendListComponent } from './friend-list/friend-list.component';
import { OauthInstagramComponent } from './oauth-instagram/oauth-instagram.component';


@NgModule({
  declarations: [
    SkaterComponent,
    SkaterViewComponent,
    FriendListComponent,
    OauthInstagramComponent
  ],
  entryComponents: [
  ],
  imports: [
    CommonModule,
    SkatersRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    FlexLayoutModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatAutocompleteModule
  ]
})
export class SkatersModule { }
