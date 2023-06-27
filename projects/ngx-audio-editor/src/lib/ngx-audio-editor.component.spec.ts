import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxAudioEditorComponent } from './ngx-audio-editor.component';

describe('NgxAudioEditorComponent', () => {
  let component: NgxAudioEditorComponent;
  let fixture: ComponentFixture<NgxAudioEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NgxAudioEditorComponent]
    });
    fixture = TestBed.createComponent(NgxAudioEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
