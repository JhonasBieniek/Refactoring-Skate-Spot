import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dialog-share',
  templateUrl: './dialog-share.component.html',
  styleUrls: ['./dialog-share.component.scss'],
  //encapsulation: ViewEncapsulation.None,
})
export class DialogShareComponent implements OnInit {
  //currentUrl = 'https://www.dugong.com.br/skatesfera/#/spot/view/';
  currentUrl = 'https://skateboardonly.com/#/spot/view/';

  constructor(private router: Router, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DialogShareComponent>) { 
    //this.currentUrl = this.currentUrl + data.spotId;
    this.currentUrl = this.currentUrl + data.spotId;
  }

  ngOnInit(): void {
  }

  close(){
    //this.router.navigate(['/']);
    this.dialogRef.close(true)
  }

}
