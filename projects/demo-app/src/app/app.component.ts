import { Component, ViewChild } from '@angular/core';
import { NgxAudioEditorComponent } from 'ngx-audio-editor';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('audioEditor') audioEditor!: NgxAudioEditorComponent;
  @ViewChild('audioEditor2') audioEditor2!: NgxAudioEditorComponent;

  handleFileInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files![0];
    if (['audio/mpeg', 'audio/wav'].includes(file?.type)) {
      this.audioEditor.reset(file);
      this.audioEditor2.reset(file);
    } else console.log('Please select an MP3 or WAV file.');
  }
}
