import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

import { WavesurferConfig, WavesurferComponent } from './wavesurfer.component';
import { Region } from 'wavesurfer.js/src/plugin/regions';

export interface AudioTransform {
  trimStart?: number;
  trimEnd?: number;
}

export const DefaultWavesurferConfig: WavesurferConfig = {
  barWidth: 4,
  barGap: 3,
  cursorWidth: 2,
  height: 200,
  waveColor: '#62879E',
  progressColor: '#41B883',
  cursorColor: '#FF0000',
};

@Component({
  selector: 'ngx-audio-editor',
  templateUrl: 'ngx-audio-editor.component.html',
  styleUrls: ['ngx-audio-editor.component.scss'],
})
export class NgxAudioEditorComponent {
  @Input()
  set demo(value: boolean | string) {
    console.log('set to demo', { value })
    this.isDemo = coerceBooleanProperty(value);
  }

  get demo() {
    return this.isDemo;
  }

  @Input()
  config: WavesurferConfig = DefaultWavesurferConfig;

  @ViewChild('wavesurferComponent', { static: false })
  wavesurferComponent?: WavesurferComponent;

  file?: File | Blob | string | null;

  enableTrimmer = false;
  trimStart?: number;
  trimEnd?: number;
  isPlaying = false;
  isDownloadingFile = false;

  get isTrimmerEnabled() {
    return this.enableTrimmer;
  }

  get audioDuration() {
    return this.wavesurferComponent?.wavesurfer?.getDuration() || 0;
  }

  get audioTransform(): AudioTransform {
    return {
      trimStart: this.trimStart,
      trimEnd: this.trimEnd,
    };
  }

  private isDemo = false;
  private trimmerRegion?: Region;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  reset(file?: typeof this.file, transform?: AudioTransform) {
    this._handleFileChange(file);
    this.changeDetectorRef.detectChanges();

    if (transform) {
      if (transform.trimStart) this.trimStart = transform.trimStart;
      if (transform.trimEnd) this.trimEnd = transform.trimEnd;

      this._initializeTrimmerRegion();
    }

    this.wavesurferComponent?.initialize();
  }

  private async _handleFileChange(file?: typeof this.file) {
    if (file instanceof File) this.file = file;
    else if (typeof file === 'string') {
      this.file = await this.urlToFile(file, 'downloaded');
    } else if (file instanceof Blob) {
      this.file = this.blobToFile(file, 'blobToFile');
    }
  }

  private _initializeTrimmerRegion() {
    this.changeDetectorRef.detectChanges(); // for ViewChild wrapped in *ngIf
    setTimeout(() => {
      if (!this.wavesurferComponent) return;
      if (typeof this.trimStart === 'number' && this.trimEnd) {
        this.enableTrimmer = true;
        this.trimmerRegion = this.wavesurferComponent.addRegion({
          start: this.trimStart,
          end: this.trimEnd,
        });
      } else {
        const start = +this.wavesurferComponent.currentTime.toFixed(2);
        const duration = +this.audioDuration.toFixed(2);
        const distance = +(duration * 0.25).toFixed(2); // make default trim region 25% long
        let end = start + distance;
        if (end > duration) end = duration;

        this.trimmerRegion = this.wavesurferComponent.addRegion({ start, end });

        // these variables are for the inputs trim "from" and "to".
        this.trimStart = start;
        this.trimEnd = end;
      }

      this.trimmerRegion &&
        this._subscribeToTrimRegionUpdate(this.trimmerRegion);
    }, 200); // FIXME: arbitrary number wavesurfer ready. much better if we can manually publish and subscribe event
  }

  /** Clears all regions, resets trim values and sets seeker to 0, */
  private _resetWaveSurferComponent() {
    this.wavesurferComponent?.clearRegions();
    this._resetTrimmer();
    this.wavesurferComponent?.seekTo(0);
  }

  toggleTrimmer() {
    this.enableTrimmer = !this.enableTrimmer;
    if (this.enableTrimmer) this._initializeTrimmerRegion();
    else this._resetWaveSurferComponent();
  }

  //#region Audio Player logic
  playpause() {
    /* NOTE: Attow, wavesurfer's Region.play() will allways start over the beginning
      of the region after pausing in the middle of the region. Users would normally expect
      the cursor to resume where they left off unless the cursor is out of region's bounds.
      To address this, we manually look into the cursor's position. */

    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      if (!this.trimmerRegion) return this.wavesurferComponent?.play();

      /* NOTE: Region.play does not stop the cursor position at exactly equal value of
        the Region.end. There is a discrepancy between them up to the 2nd decimal place.
        For this reason, we round the values up to at least one decimal place.
        Otherwise, when the cursor appears to stop at the end of the region,
        we would repeatedly resume playing the last n < 1 seconds of the region
        instead of starting over at the Region.start. */
      const pos = +(this.wavesurferComponent?.position?.toFixed(1) || 0);
      const regionStart = +this.trimmerRegion.start?.toFixed(1) || 0;
      const regionEnd = +this.trimmerRegion.end?.toFixed(1) || 0;
      // resume if cursor is not out of region's bounds.
      if (regionStart < pos && pos < regionEnd) {
        this.wavesurferComponent?.play(
          this.wavesurferComponent.position,
          regionEnd
        );
      } else {
        // Otherwise, start over the beginning of region
        this.trimmerRegion.play();
      }
    } else {
      this.wavesurferComponent?.pause();
    }
  }

  stop() {
    this.wavesurferComponent?.stop();
    if (this.trimmerRegion)
      this.wavesurferComponent?.seekToSeconds(this.trimmerRegion.start);
  }

  //#endregion Audio Player logic

  //#region Trim feature logic
  trimFromBeginning() {
    this.setTrimStart(0);
    this.wavesurferComponent?.seekTo(0);
  }

  trimToEnd() {
    this.setTrimEnd(Infinity);
  }

  // just an arbitrary value. wavesurfer has a bug if Region.end is set equal to Region.start
  private readonly _minimumDifference = 0.1;

  setTrimStart(value: number) {
    if (value === null || value === undefined) return;
    const end = Number(this.trimEnd?.toFixed(2) || 0);
    let start = +value.toFixed(2);
    // Prevent start > end
    if (value > end) start = end;
    // Prevent input lower than 0
    if (value < 0) start = 0;

    this.trimStart = start;

    // Update Region
    this.trimmerRegion?.update({ id: this.trimmerRegion.id, start });
  }

  setTrimEnd(value: number) {
    if (value === null || value === undefined) return;
    const start = Number(this.trimStart?.toFixed(2) || 0);
    const duration = +this.audioDuration.toFixed(2);
    let end = +value.toFixed(2);

    // Prevent end > audio duration
    if (value > duration) end = duration;
    // Prevent end < start
    if (value < start) {
      const distance = +(start + this._minimumDifference).toFixed(2);
      end = distance < duration ? distance : duration;
    }

    this.trimEnd = end;

    // Update Region
    this.trimmerRegion?.update({ id: this.trimmerRegion.id, end });
  }
  //#endregion Trim feature logic

  //#region native trim ui event handlers
  private debounceTrimStartFix?: ReturnType<typeof setTimeout>;
  onTrimStartKeyDown(event: KeyboardEvent) {
    const end = this.trimEnd || 0;
    const start = this.trimStart || 0;
    if (/[a-zA-Z]/.test(event.key) && event.key.length === 1 && !event.ctrlKey)
      event.preventDefault();
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      /* This is better than browser's default `input[type="number"]` increment since the
        default behavior, input[step=1], is rounding up the current value (if float) to the
        next largest integer (e.g. if value is 2.6, next value upwards is 3, not 3.6).
        Instead, we want to simply increment by 1 and keep the decimal digits if present. */
      this.setTrimStart(start + 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setTrimStart(start - 1);
    } else {
      this.debounceTrimStartFix && clearTimeout(this.debounceTrimStartFix);
      this.debounceTrimStartFix = setTimeout(() => {
        const input = event.target as HTMLInputElement;
        const numberValue = Number(input.value);
        // sync 2way-binding and Region bounds
        this.setTrimStart(numberValue);
        // setTrimStart's updating of the ngModel (trimStart) does not seem to update the input value.
        // Doing it manually instead.
        if (numberValue > end) input.value = end.toFixed(2);
        else input.value = +numberValue.toFixed(2) + ''; // round up 2.222[2].. (when user holds a digit)
      }, 250);
    }
  }

  private debounceTrimEndFix?: ReturnType<typeof setTimeout>;
  onTrimEndKeyDown(event: KeyboardEvent) {
    const end = this.trimEnd || 0;
    const start = this.trimStart || 0;
    const distance = start + this._minimumDifference;
    const duration = +this.audioDuration.toFixed(2);

    if (/[a-zA-Z]/.test(event.key) && event.key.length === 1 && !event.ctrlKey) event.preventDefault();
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setTrimEnd(end + 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setTrimEnd(end - 1);
    } else {
      this.debounceTrimEndFix && clearTimeout(this.debounceTrimEndFix);
      this.debounceTrimEndFix = setTimeout(() => {
        const input = event.target as HTMLInputElement;
        const numberValue = Number(input.value);
        // sync 2way-binding and Region bounds
        this.setTrimEnd(numberValue);
        // setTrimEnd's updating of the ngModel (trimEnd) does not seem to update the input value.
        // Doing it manually instead.
        const value = distance < duration ? distance : duration;
        if (numberValue <= start) input.value = value.toFixed(2);
        else input.value = (+numberValue.toFixed(2)) + ''; // round up 2.222[2].. (when user holds a digit)
      }, 250);
    }
  }
  //#endregion native trim ui event handlers

  private _subscribeToTrimRegionUpdate(region: Region) {
    // NOTE: The unsubscribe for this is already handled by WavesurferComponent.ngOnDestroy
    region.wavesurfer.on('region-updated', ($event: Region) =>
      this._updateTrimmerParams($event)
    );
  }

  private _updateTrimmerParams(region: Region) {
    this.trimStart = +region.start.toFixed(2);
    this.trimEnd = +region.end.toFixed(2);
  }

  private _resetTrimmer() {
    this.trimStart = undefined;
    this.trimEnd = undefined;
    this.trimmerRegion = undefined;
  }

  private async urlToFile(url: string, fileName?: string): Promise<File> {
    this.isDownloadingFile = true;
    const response = await fetch(url);
    const blob = await response.blob();
    this.isDownloadingFile = false;
    return this.blobToFile(blob, fileName);
  }

  private blobToFile(blob: Blob, fileName?: string): File {
    const metadata = { type: blob.type };
    return new File([blob], fileName || new Date().toJSON().slice(0, 10), metadata);
  }
}
