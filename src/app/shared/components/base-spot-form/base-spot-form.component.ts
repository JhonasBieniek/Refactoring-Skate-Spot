import { NavbarService } from '../../services/navbar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NgxImageCompressService } from 'ngx-image-compress';
import { SharedService } from './../../../core/services/shared.service';
import { HttpClient } from '@angular/common/http';
import { ConditionsService } from '../../services/conditions.service';
import { TypesService } from '../../services/types.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../services/notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpotService } from '../../../pages/spot/shared/spot.service';
import { AuthService } from './../../../core/services/auth.service';

import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Directive, OnInit, Injector } from '@angular/core';

@Directive()
export abstract class BaseSpotFormComponent implements OnInit {

    currentAction!: string;
    resourceForm!: FormGroup;
    data: any;
    disabled: boolean = false;

    protected formBuilder: FormBuilder;

    constructor(
        protected injector: Injector,
        protected route: ActivatedRoute,
        protected router: Router,
        protected fb: FormBuilder,
        protected authService: AuthService,
        protected _snackBar: MatSnackBar,
        protected notification: NotificationService,
        protected dialog: MatDialog,
        protected typesService: TypesService,
        protected conditionsService: ConditionsService,
        protected httpClient: HttpClient,
        protected sharedService: SharedService,
        protected imageCompress: NgxImageCompressService,
        protected spotservice: SpotService,
        protected breakpointObserver: BreakpointObserver,
        protected navbarService: NavbarService
    ) {
        this.formBuilder = this.injector.get(FormBuilder);
    }

    ngOnInit(): void {
        this.setCurrentAction();
        this.buildResourceForm();
        this.loadResource();
    }

    protected setCurrentAction() {
        if (this.router.url.includes('edit'))
            this.currentAction = "edit"
        else
            this.currentAction = "new"
    }

    protected loadResource() {
        this.disabled = true;
        this.spotservice.getSpotView(this.route.snapshot.params['id']).then((docSnap) => {
            if (docSnap.exists()) {
              this.data = docSnap.data();
              this.resourceForm.patchValue(this.data)
              this.disabled = false;
            } else {
              this.notification.notify("Spot not Found !", 4000);
              this.router.navigate(['/'])
            }
          });

    }

    protected abstract buildResourceForm(): void;
}