import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-oauth-instagram',
  templateUrl: './oauth-instagram.component.html',
  styleUrls: ['./oauth-instagram.component.scss']
})
export class OauthInstagramComponent implements OnInit {

  code:any;
  user:any;
  constructor(private activatedRoute: ActivatedRoute, private authService: AuthService) {
    activatedRoute.queryParams.subscribe(params => {
      this.code = params['code'];
    });

    
  }

  ngOnInit(): void {
    if(this.code) {
      //console.log(this.code);
    }

    this.authService.get_authState().onAuthStateChanged(user => {
      if(user != null){
        this.user = user;
        //console.log(this.user)

        if(this.code) {
          this.getInstagramToken(this.user.uid,this.code);
        }
      }
    }, err => {
      //console.log(err)
    });
    
  }

  getInstagramToken(uid:string, code: string){
    this.authService.setInstagramToken({
      uid: uid,
      code: code
    }).then( response => {
      //console.log(response)
    });
  }

}
