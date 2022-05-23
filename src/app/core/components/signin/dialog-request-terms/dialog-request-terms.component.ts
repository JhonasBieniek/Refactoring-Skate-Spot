import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseError } from 'firebase/app';
import { arrayUnion, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { SkaterService } from 'src/app/pages/skaters/shared/skater.service';
import { TermsService } from 'src/app/shared/services/termsConditions.service';
import { DialogTerms } from '../signup-email/signup-email.component';

@Component({
  selector: 'app-dialog-request-terms',
  templateUrl: './dialog-request-terms.component.html',
  styleUrls: ['./dialog-request-terms.component.scss']
})
export class DialogRequestTermsComponent {

  disabled: boolean = false;
  terms: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogRequestTermsComponent>,
    private termsService: TermsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    private skaterService: SkaterService,
    private notification: NotificationService
  ) {
    dialogRef.disableClose = true;
    this.terms = data.terms;
    // this.termsService.getTerms().then((results: QuerySnapshot) => {
    //   let docs: any[] = [];
    //   results.forEach((result: QueryDocumentSnapshot) => {
    //     let term = result.data();
    //     //data['uid'] = result.id;
    //     docs.push({
    //       name: term.name,
    //       checked: false,
    //       content: term.content,
    //       uid: result.id
    //     });
    //   });
    //   this.terms = docs;
    // });
    
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

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        let index = this.terms.findIndex( checkTerm => { return checkTerm.uid === term.uid});
        if(index >= 0) this.terms[index].checked = true;
      }
    });
    
  }

  save(){
    let result = this.terms.every( (term) => {
      return term.checked;
    });
    if(result){
      this.disabled = true;
      this.skaterService.updateSkater(this.data.user_uid, { terms: arrayUnion(...this.terms) }).then( ()=>{
        this.disabled = false;
        this.notification.notify("Terms saved successfully!", 2000);
        this.dialogRef.close();
      }).catch( (err: FirebaseError) => {
        this.disabled = false;
        this.notification.notify("Failed to save tems!, message error: "+ err.message, 2000);
        this.dialogRef.close();
      });
    }else{
      this.notification.notify("All terms must be accepted !", 2000);
    }
    
  }

  // onNoClick(): void {
  //     this.dialogRef.close();
  // }


}
