import { DOC_ORIENTATION } from 'ngx-image-compress';

export interface imagePreview {
    name: string;
    file: any;
    orientation: DOC_ORIENTATION,
    cover: boolean
  }