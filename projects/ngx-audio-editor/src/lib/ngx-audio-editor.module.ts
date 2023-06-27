import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxAudioEditorComponent } from './ngx-audio-editor.component';
import { WavesurferComponent } from './wavesurfer.component';

@NgModule({
  declarations: [
    WavesurferComponent,
    NgxAudioEditorComponent
  ],
  exports: [
    WavesurferComponent,
    NgxAudioEditorComponent
  ],
  imports: [
    FormsModule
  ]
})
export class NgxAudioEditorModule { }
