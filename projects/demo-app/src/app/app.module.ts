import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgxAudioEditorModule } from 'ngx-audio-editor';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxAudioEditorModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
