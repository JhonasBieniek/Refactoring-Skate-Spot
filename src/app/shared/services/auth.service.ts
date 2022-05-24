import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthProvider, createUserWithEmailAndPassword, FacebookAuthProvider, getAdditionalUserInfo, getAuth, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, UserCredential } from 'firebase/auth';
import { Skater } from 'src/app/pages/skaters/shared/skater.model';
import { SharedService } from './shared.service';
import { SkaterService } from '../../pages/skaters/shared/skater.service';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { MatDialog } from '@angular/material/dialog';
import { DialogRequestTermsComponent } from '../../core/components/signin/dialog-request-terms/dialog-request-terms.component';
import { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  userLoaded: boolean = false;
  public user: any = null;
  private functions = getFunctions();
  private setInsta = httpsCallable(this.functions, 'insta2');
  constructor(
    private router: Router,
    private skaterService: SkaterService,
    private sharedService: SharedService,
    private dialog: MatDialog,
  ) { 
    
  }

  // Sign in with email/password
  SignIn(email: string, password: string) {
    return signInWithEmailAndPassword(getAuth(), email, password)
      .then((result: any) => 
      {
        this.sharedService.notify("Welcome, "+ this.capitalizeWords(result.user.displayName !== null ? result.user.displayName : ''), 2000);
        this.termsValidation(result.user.uid);
        this.getUser();
        return {
          status: true,
          message: result.user
        }

      }).catch((error) => {
        //console.log(error.code)
        return {
          status: false,
          message: error
        }
      })
  }

  // Sign up with email/password
  CreateUser(email: string, password: string, userName:string, terms: any[]) {
    return createUserWithEmailAndPassword(getAuth(), email, password)
      .then((result) => {
        /* Call the SendVerificaitonMail() function when new user sign 
        up and returns promise */
        if(getAdditionalUserInfo(result)?.isNewUser){
          let skater: Skater = {
            name: userName,
            email: email,
            user_uid: result.user.uid,
            created: new Date(),
            terms: terms
          }
      
          this.skaterService.createSkater(skater);
        }

        sendEmailVerification(result.user);
        updateProfile(result.user,{
          displayName: userName
        });
        this.sharedService.notify("Welcome, "+ this.capitalizeWords(userName), 2000);
        this.getUser();
        return {
          status: true,
          message: result.user
        }

      }).catch((error: any) => {
        return {
          status: false,
          message: error
        }
      })
  }

  // Send email verfificaiton when new user sign up
  /*SendVerificationMail() {
    let user = getAuth().currentUser
    if (user != null) {
      return sendEmailVerification(user)
    
    } else {
      return "No Logged User"
    }
  }*/

  termsValidation(user_uid:string){
    this.skaterService.getSkaterView(this.user.uid).then( (docSnap) => {
        let skater = docSnap.data();
        this.sharedService.getTerms().then((results: QuerySnapshot) => {
          let terms: any[] = [];
          results.forEach((result: QueryDocumentSnapshot) => {
            let data = result.data();
            if(skater?.terms){
              let index = skater.terms.findIndex( (term: any) => term.uid === result.id)
              if(index === -1){
                terms.push({
                  name: data.name,
                  checked: false,
                  content: data.content,
                  uid: result.id
                });
              }
            }else{
              terms.push({
                name: data.name,
                checked: false,
                content: data.content,
                uid: result.id
              });
            }
          });
          if(terms.length !== 0){
            this.dialog.open(DialogRequestTermsComponent, {
              width: '350px',
              data: {
                user_uid: user_uid,
                terms: terms
              }
            });
          }
        });
    });
  }

  // Reset Forggot password
  ForgotPassword(passwordResetEmail: string) {
    return sendPasswordResetEmail(getAuth(), passwordResetEmail)
      .then(() => {
        return {
          status: true,
          message: "Password reset email sent, check your inbox."
        }
      }).catch((error) => {
        return {
          status: false,
          message: error
        }
      })
  }

  // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new GoogleAuthProvider);
  }

  // Sign in with Google
  FacebookAuth() {
    return this.AuthLogin(new FacebookAuthProvider);
  }

  // Auth logic to run auth providers
  AuthLogin(provider: AuthProvider){
    return signInWithPopup(getAuth(), provider)
      .then((result:UserCredential) => {
        if(getAdditionalUserInfo(result)?.isNewUser){
          let skater: Skater = {
            name: result.user.displayName ? result.user.displayName : '',
            email: result.user.email ? result.user.email : '',
            user_uid: result.user.uid,
            created: new Date()
          }
      
          this.skaterService.createSkater(skater).then(()=>{
            this.termsValidation(result.user.uid);
          });
        }else{
          this.termsValidation(result.user.uid);
        }

        this.sharedService.notify("Welcome, "+ this.capitalizeWords(result.user.displayName !== null ? result.user.displayName : ''), 2000);
        this.getUser();
        return {
          status: true,
          user: result.user
        };
      }).catch((error) => {

        return {
          status: false,
          error: error
        };
      });
  }

  capitalizeWords(text: string){
    return text.replace(/(?:^|\s)\S/g,(res)=>{ return res.toUpperCase();})
  };

  logout() {
    signOut(getAuth()).then( () =>{
      this.userLoaded = false;
      this.user = null; 
      this.router.navigate(['/'])  
    });
  }

  getAuthUser(){
    return getAuth().currentUser;
  }

  get_authState(){
    return getAuth();
  }

  // Auth logic to run auth providers
  getUser() {
    if (this.userLoaded) {
      return getAuth().currentUser;
    }else{
      return new Promise((resolve, reject) => {
        const unsubscribe = getAuth().onAuthStateChanged(user => {
          this.userLoaded = true;
          if(user != null){
            this.user = user;
            unsubscribe();
          }
          resolve(user);
        }, reject);
      });
    }
  }
  get isLoggedIn(): boolean {
    let user: any = this.getUser();
    // if(user !== null && user.emailVerified == false){
    //   this.notification.notify("Check your email before proceeding!.", 4000)
    // }
    // (user !== null && user.emailVerified != false) ? true : false
    return user;
  }

  setInstagramToken(dados:any) {
    return this.setInsta(dados);
  }

}