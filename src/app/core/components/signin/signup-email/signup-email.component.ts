import { Component, Inject, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { AuthService } from 'src/app/shared/services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { terms, TermsService } from 'src/app/shared/services/termsConditions.service';

@Component({
  selector: 'app-signup-email',
  templateUrl: './signup-email.component.html',
  styleUrls: ['./signup-email.component.scss']
})
export class SignupEmailComponent implements OnInit {

  errorMessage:string = '';
  form!: FormGroup;
  terms: any[] = [];
  disabled: boolean = false;
  
  constructor(public authService: AuthService, private fb: FormBuilder, public dialogRef: MatDialogRef<SignupEmailComponent>, public dialog: MatDialog,
    private ngZone: NgZone, public termsService: TermsService, private notification: NotificationService) { 
      this.termsService.getTerms().then((results: QuerySnapshot) => {
        let docs: any[] = [];
        results.forEach((result: QueryDocumentSnapshot) => {
          let data = result.data();

          //data['uid'] = result.id;
          docs.push({
            name: data.name,
            checked: false,
            content: data.content,
            uid: result.id
          });
        });
        this.terms = docs;
      });
    }
  
  ngOnInit(): void {
    this.form = this.fb.group({
      name: [null,[Validators.required,Validators.minLength(5)]],
      email: [null,[Validators.required,Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]]
    }, {validator: this.passwordMatchValidator});
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('passwordConfirm')?.value ? null : {'mismatch': true};
  }
  
  async signUp(){
    const every = this.terms.every( term => term.checked);
    if(this.form.valid && every){
      this.disabled = true;
      this.errorMessage = '';
      let signup = this.authService.CreateUser(this.form.value.email, this.form.value.password, this.form.value.name, this.terms);
      this.disabled = false
      if((await signup).status == false){
        if((await signup).message.code == "auth/email-already-in-use"){
          this.errorMessage = "Email already in use"
        }else{
          //console.log((await signup).message.code);
          this.errorMessage = (await signup).message.code;
        }
      }else{
        this.dialogRef.close(true);
        //console.log(signup);
        //console.log(this.authService.getUser());
      }
    }else{
      this.form.markAllAsTouched();
      if(!every){
        this.notification.notify("All terms need be checked!", 1500);
      }
    }
    
  }

  showTerms(term: any){
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      maxWidth: '95vw',
      maxHeight: '90vh'
    }
    dialogConfig.data = term;
    let dialogRef = this.dialog.open(DialogTerms,
      dialogConfig
    ); 

    // const dialogRef = this.dialog.open(DialogTerms, {
    //   data: term,
    // });

    dialogRef.afterClosed().subscribe(result => {
      //console.log(result)
      if(result){
        //console.log(term)
        let index = this.terms.findIndex( checkTerm => { return checkTerm.uid === term.uid});
        if(index >= 0) this.terms[index].checked = true;
      }
    });
    
  }
}

@Component({
  selector: 'dialog-terms',
  templateUrl: 'dialog-terms.html',
})
export class DialogTerms {
  constructor(
    public dialogRef: MatDialogRef<DialogTerms>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
}
