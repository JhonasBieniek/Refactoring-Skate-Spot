import { Injectable, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SigninComponent } from '../components/signin/signin.component';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    public authService: AuthService,
    public router: Router,
    private dialog: MatDialog,
    private notification: NotificationService
  ) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const user:any = this.authService.isLoggedIn;
    if(this.authService.getAuthUser() === null && localStorage.getItem('functionLogin') !== null) {
      let dialogConfig = new MatDialogConfig();
        dialogConfig = {
          maxWidth: '100vw',
          maxHeight: '100vh',
          width: '450px',
        }
        let dialogRef = this.dialog.open(
          SigninComponent,
          dialogConfig,
        );
        dialogRef.afterClosed().subscribe(() =>{
        if(this.authService.isLoggedIn !== null){
            let userFunction = localStorage.getItem('functionLogin')
            localStorage.removeItem('functionLogin')
            if(userFunction == 'newSpot'){
              document.getElementById('newSpot')?.click()
            } else {
              document.getElementById('profile')?.click()
            }
          }
        })
      return false;
    }else if(user !== null && user.emailVerified != false){
      return true;
    } else if(user !== null && user.emailVerified == false){
      this.notification.notify("Check your email before proceeding!.", 4000);
      return false;
    } else {
      return false;
    }
  }

}
