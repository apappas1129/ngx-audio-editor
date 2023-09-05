# ngx-audio-editor

An [Angular](https://angular.io/) UI Component library that provides a GUI for editing an audio.

NOTE:
1. The current editing feature available is audio trimming. You are welcome to [contribute](#contributing) and create a pull request to extend the component with more features.
2. Soft [transform values](#audiotransform) are returned by the component. It does not output a modified file.

## Installation

```
npm install --save ngx-audio-editor
```

## Usage

### Initialize module

Import the library into your app module:

```ts
import { NgxAudioEditorModule } from 'ngx-audio-editor';
@NgModule({
  imports: [
    // ... your other module imports
    NgxAudioEditorModule,
  ],
})
```

### In your component template
```html
<ngx-audio-editor #audioEditor></ngx-audio-editor>

<input type="file" (change)="handleFileInput($event)" accept=".mp3, .wav" multiple="false">

<button (click)="audioEditor.playpause()"> Play/Pause </button>
<button (click)="audioEditor.stop()"> Stop </button>
<button (click)="audioEditor.toggleTrimmer()">
  {{ audioEditor.isTrimmerEnabled ? 'Disable Trimmer' : 'Enable Trimmer' }}
</button>
<ng-container *ngIf="audioEditor2.isTrimmerEnabled">
  <span class="custom-trim-start"> start: {{ audioEditor.trimStart }} </span>
  <span class="custom-trim-end"> end: {{ audioEditor.trimEnd }} </span>
</ng-container>
```

### In your component class
```ts
@ViewChild() audioEditor!: NgxAudioEditorComponent;

handleFileInput(event: Event) {
  const inputElement = event.target as HTMLInputElement;
  const file = inputElement.files![0];

  if (['audio/mpeg', 'audio/wav'].includes(file?.type)) this.audioEditor.reset(file);
  else alert('Please select an MP3 or WAV file.');
}
```

### NgxAudioEditorComponent

| **Input**  |  |  |  |
|------------|--|--|--|
| config | [WavesurferConfig](#wavesurferconfig) | required |  |
| trimRegionOptions | [RegionParams](https://wavesurfer-js.org/docs/types/plugins_regions.RegionParams) | optional | You can customize the region's rectangle with the property `color` and the left & right handles with css styles in json format (camelCased styles) |
| demo | boolean | optional | to show a full example of the audio editor |
| **Properties** | | | |
| audioDuration | number| | |
| audioTransform | [AudioTransform](#audiotransform) | | The resulting transform values from written by the editor that is up to the consumer's end how to apply an actual mutation to the original file. |
| isPlaying | boolean | | treat this as `readonly` |
| isTrimmerEnabled | boolean | | treat this as `readonly` |
| trimEnd | number | | you may bind this with `ngModel` on your custom controls |
| trimStart | number | | you may bind this with `ngModel` on your custom controls |
| isDownloadingFile | boolean | | This becomes `true` when a `file` type `string` is fed into the `reset` which treats the value as a URL and proceeds to download the file. By default, and when the download ends, this is `false`. You may reuse this and mutate its value accordingly when you do your own download script before feeding `reset` a `Blob` or `File`. |
| **Methods** | | | |
| reset(file?: File \| Blob \| string \| null, transform?: AudioTransform) | void | | Initializes/Resets the component with the the given `file` and `transform` values. Note that if `file` is of type `string`, a regular `fetch(url)` will be invoked to download the file and load it into the editor. |
| playpause() | void | | Play/pause audio. |
| stop() | void | | Stops playing audio. Returns progress cursor back to the beginning of the audio or the `trimStart`. |
| toggleTrimmer() | void | | Enables/Disables the trim feature. Note that this must be invoked to enable the trim feature either programmatically or by user action before trimming functions below are called. |
| trimFromBeginning() | void | | Moves the trim Region's left handle to the beginning of the audio. |
| trimToEnd() | void | | Moves the trim Region's right handle to the end of the audio. |
| setTrimStart(value: number) | void | | Moves the trim Region's left handle to the given value in seconds. |
| setTrimEnd(value: number) | void | | Moves the trim Region's right handle to the given value in seconds. |
| onTrimStartKeyDown(event: KeyboardEvent) | void | | A `keydown` event handler for when you create an `input[type=number]` intended for setting the `trimStart`. It will check for `event.key`'s `'ArrowUp'` and `'ArrowDown` and will increment or decrement the current value by 1 second. The default browser behavior, `input[step=1]`, rounds up the current value (if float) to the next integer (e.g. `2.6` , next value on `ArrowUp` is `3` instead of `3.6`). I personally don't like it and want to make the next increment/decrement not modify the present decimal numbers. This may be further improved to allow a decimal number increment using `Ctrl` + `ArrowUp`. But I will leave it to you and you may create a pull request for this. |
| onTrimEndKeyDown(event: KeyboardEvent)                                   | void           |          | The same as above for a custom `input[type=number]` for `trimEnd`. |

### WavesurferConfig
<div class="highlight highlight-source-ts notranslate position-relative overflow-auto">
  <pre><code> type WavesurferConfig = Pick<<a href="https://wavesurfer-js.org/docs/types/wavesurfer.WaveSurferOptions">WaveSurferParams</a>, Exclude&lt;keyof <a href="https://wavesurfer-js.org/docs/types/wavesurfer.WaveSurferOptions">WaveSurferParams</a>, 'container' | 'plugins'>>; </code> </pre>
</div>

### AudioTransform

```ts
interface AudioTransform {
  trimStart?: number;
  trimEnd?: number;
  // more edit features in the future (🤞 hopefully)
}
```

## Contributing
### Known Issues/Limitations
1. Component can be improved to enable the consumer to provide information how to fetch the file in type `string` instead of a regular `fetch(url)` call. (This is least prio since the consumer side can do the download itself before feeding a `File` or a `Blob` to the `reset` function).
2. Component does not actually manipulate and return an actual edited audio. It only returns soft values that are up to
the consumer on how to use it and apply to mutate the original file.
3. Component is not opened yet to accept more Wavesurfer plugins that are up to consumer's freedom to configure and integrate.
4. Component can only trim the audio. We need more editing features.
5. Other limitations/bugs (Please file an Issue)

### Development

Run `ng serve` and `npm run watch` on separate terminals.
