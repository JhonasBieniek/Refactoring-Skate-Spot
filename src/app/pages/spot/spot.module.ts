import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { ShareButtonsPopupModule } from 'ngx-sharebuttons/popup';
import { NgxImageCompressService } from "ngx-image-compress";

import { SpotComponent } from './spot.component';
import { SpotRoutingModule } from './spot-routing.module';
import { SpotViewComponent } from './spot-view/spot-view.component';
import { StarReviewComponent } from './spot-view/star-review/star-review.component';
import { StarReviewAddComponent } from './spot-view/star-review-add/star-review-add.component';
import { ReportAddComponent } from './spot-view/report-add/report-add.component';
import { DialogShareComponent } from './dialog-share/dialog-share.component';
import { SpotEditComponent } from './spot-edit/spot-edit.component';
import { ReviewAddComponent } from './spot-view/review-add/review-add.component';

import { fas, faShare, faTimesCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    SpotComponent,
    SpotViewComponent,
    StarReviewComponent,
    StarReviewAddComponent,
    ReportAddComponent,
    DialogShareComponent,
    SpotEditComponent,
    ReviewAddComponent
  ],
  entryComponents: [
    SpotViewComponent,
    ReportAddComponent,
    DialogShareComponent
  ],
  imports: [
    CommonModule,
    SpotRoutingModule,
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
    MatDialogModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    // ShareButtonsModule.withConfig({
    //   debug: true
    // }),
    ShareButtonsPopupModule,
    ShareIconsModule,
    MatMenuModule,
    MatExpansionModule,
  ],
  providers: [
    NgxImageCompressService
  ]
})
export class SpotModule { 
  constructor(library: FaIconLibrary){
    library.addIconPacks(fas);
    library.addIcons(faShare, faTimesCircle, faCircle);
  }
}
