import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { SigninComponent } from './components/signin/signin.component';
import { MatListModule } from '@angular/material/list';
import { SignEmailComponent } from './components/signin/sign-email/sign-email.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogTerms, SignupEmailComponent } from './components/signin/signup-email/signup-email.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { ForgotPasswordComponent } from './components/signin/forgot-password/forgot-password.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { QuillModule } from 'ngx-quill';
import { DialogRequestTermsComponent } from './components/signin/dialog-request-terms/dialog-request-terms.component';


@NgModule({
  declarations: [
    NavbarComponent,
    SigninComponent,
    SignEmailComponent,
    SignupEmailComponent,
    ForgotPasswordComponent,
    DialogTerms,
    DialogRequestTermsComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    GoogleMapsModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatMenuModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    QuillModule.forRoot()
  ],
  entryComponents: [
    SignEmailComponent,
  ],
  exports:[
    // shared modules
    BrowserModule,
    BrowserAnimationsModule,

    //Shared components
    NavbarComponent,
    SigninComponent,
  ],
  providers:[
    // {
    //   provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true
    // }
  ]
})
export class CoreModule { }
