import { Component, Input, AfterViewInit, OnDestroy, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

import WaveSurfer from 'wavesurfer.js';
import { WaveSurferParams } from 'wavesurfer.js/types/params';
import RegionsPlugin, { Region, RegionParams, RegionsPluginParams } from 'wavesurfer.js/src/plugin/regions';

export type WavesurferConfig = Pick<WaveSurferParams, Exclude<keyof WaveSurferParams, 'container' | 'plugins'>>;

@Component({
  selector: 'wavesurfer',
  template: '<div [id]="uuid"></div>',
})
export class WavesurferComponent implements AfterViewInit, OnChanges, OnInit, OnDestroy {
  /** `string` URL to the track, `Blob`, or a `File`. */
  @Input() track?: string | Blob | File | null;
  @Input() config!: WavesurferConfig;
  @Input() regionOptions: RegionsPluginParams = {};

  @Input()
  set region(value: boolean | string) {
    this._enableRegionPlugin = coerceBooleanProperty(value);
  }

  get region() {
    return this._enableRegionPlugin;
  }

  /** Event emitted when playing audio has finisihed */
  @Output() finished = new EventEmitter();
  /** Event emitted when `wavesurfer.pause` and (ATTOW) `wavesurfer.stop` is invoked. */
  @Output() paused = new EventEmitter();

  readonly uuid = this.generateUUID();
  wavesurfer?: WaveSurfer;
  /** Player cursor position in **seconds** */
  position = 0;

  private _enableRegionPlugin = false;
  private _regionPlugin?: RegionsPlugin;

  constructor() { }

  ngOnInit() {
    if (!this.config) throw new Error('@Input config is required.');
  }

  ngAfterViewInit() {
    setTimeout(() => this.initialize());
  }

  ngOnChanges() {
    if (!this.wavesurfer) return;
    if (this.track) this.loadAudio(this.track);
    else this.wavesurfer?.destroy(); // Removes events, elements and disconnects Web Audio nodes
    this.initPlugins();
  }

  ngOnDestroy() {
    this.wavesurfer?.unAll();
    this.wavesurfer?.destroy();
  }

  initialize() {
    if (this.wavesurfer) return;

    try {
      this.wavesurfer = WaveSurfer.create({ container: '#' + this.uuid, ...this.config });
      this.wavesurfer.on('finish', () => this.finished.emit());
      this.wavesurfer.on('pause', () => this.paused.emit());
      this.trackPosition(this.wavesurfer);
      if (this.track) this.loadAudio(this.track);
      this.initPlugins();
    } catch (error) {
      console.warn(error);
      console.info('Make sure div#' + this.uuid + 'is added to the dom.');
    }
  }

  loadAudio(audio: File | Blob | string) {
    if (!this.wavesurfer) throw new Error('wavesurfer is undefined.');

    if (typeof audio === 'string') this.wavesurfer.load(audio);
    else this.wavesurfer.loadBlob(audio);
  }

  play(start?: number, end?: number) {
    this.wavesurfer?.play(start, end);
  }

  stop() {
    this.wavesurfer?.stop();
  }

  pause() {
    this.wavesurfer?.pause();
  }

  playPause() {
    this.wavesurfer?.playPause();
  }

  /** Return cursor position in seconds */
  get currentTime() {
    return this.wavesurfer?.getCurrentTime() || 0;
  }

  /** Seeks to a progress [0..1] (0 = beginning, 1 = end) */
  seekTo(position: number) {
    this.wavesurfer?.seekTo(position);
  }

  seekToSeconds(seconds: number) {
    let pos = seconds / (this.wavesurfer?.getDuration() || 0);
    if (pos > 1) pos = 1;
    this.seekTo(pos);
  }

  addRegion(options: Partial<RegionParams> = {}): Region | undefined {
    if (!options.id) options.id = this.generateUUID();
    return this._regionPlugin?.add(options as RegionParams);
  }

  clearRegions() {
    this._regionPlugin?.clear();
  }

  private initPlugins() {
    if (this._enableRegionPlugin) this.addRegionPlugin();
    else this.wavesurfer?.destroyPlugin('region');

    // can do more plugin support here
  }

  private addRegionPlugin() {
    if (!this.wavesurfer) return;
    if (!this._regionPlugin) {
      this._regionPlugin = new RegionsPlugin(this.regionOptions || {}, this.wavesurfer);
    }
  }

  private generateUUID() {
    const firstPart = (Math.random() * 46656) | 0;
    const secondPart = (Math.random() * 46656) | 0;
    const firstPartx = ('000' + firstPart.toString(36)).slice(-3);
    const secondPartx = ('000' + secondPart.toString(36)).slice(-3);
    return 'ws' + firstPartx + secondPartx;
  }

  trackPosition(ws: WaveSurfer) {
    ws.on('audioprocess', (pos: number) => this.position = pos);

    // `audioprocess` is not fired when seeking, so we have to plug into the
    // `seek` event and calculate the equivalent in seconds (seek event
    // receives a position float 0-1)
    ws.on('seek', (pos: number) => this.position = this.positionToSec(pos));
  }

  // receives position as a float 0-1 and transforms this to seconds
  positionToSec(pos: number) {
    return pos * (this.wavesurfer?.getDuration() || 0);
  }
}
