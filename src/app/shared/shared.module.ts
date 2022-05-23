import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapsComponent } from './components/maps/maps.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import {MatButtonModule} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { BaseSpotFormComponent } from './components/base-spot-form/base-spot-form.component';


@NgModule({
  declarations: [
    MapsComponent,
    ConfirmationDialogComponent
  ],
  imports: [
    CommonModule,
    GoogleMapsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
  ],
  exports: [
    MapsComponent
  ],
  providers: [
  ]
})
export class SharedModule { }
