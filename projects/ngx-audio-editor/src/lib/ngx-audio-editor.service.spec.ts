import { TestBed } from '@angular/core/testing';

import { NgxAudioEditorService } from './ngx-audio-editor.service';

describe('NgxAudioEditorService', () => {
  let service: NgxAudioEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxAudioEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
