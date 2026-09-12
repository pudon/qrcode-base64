# qrcode-base64

English | [简体中文](https://github.com/pudon/qrcode-base64/blob/master/README.zh-CN.md)

**[Live demo →](https://pudon.github.io/qrcode-base64/)**

Generate base64-encoded QR codes without canvas. Zero runtime dependencies. Works in Vue2 / Vue3 / React / WeChat Mini Program / Node / browsers.

`drawImg(text)` returns a `data:image/png;base64,...` string — use it directly as the `src` of an `<image>` / `<img>`.

## Install

```bash
npm install qrcode-base64
```

## Usage

```js
import QR from 'qrcode-base64';
// or: import { drawImg } from 'qrcode-base64'  →  drawImg(...)

const url = QR.drawImg('github.com/pudon', { size: 500 });

// A single options object works too, with the content in `text`:
const url2 = QR.drawImg({
  text: 'github.com/pudon',
  size: 500
});
```

CommonJS:

```js
const QR = require('qrcode-base64');

const url = QR.drawImg('github.com/pudon', { size: 500 });
```

UMD, global name `QRCode`:

```html
<script src="https://unpkg.com/qrcode-base64/dist/qrcode-base64.umd.js"></script>
<script>
  const url = QRCode.drawImg('Hello', { size: 300 });
</script>
```

## Options

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | Content to encode, Chinese / Emoji supported (UTF-8). Only used in the single-argument form `drawImg(options)`; with `drawImg(text, options)` the first argument wins and this field is ignored |
| `typeNumber` | `number` | `4` | QR version 1–40. Sets the module count (`version × 4 + 17`) and therefore the capacity. Escalates automatically when the content does not fit, so you rarely need to set it |
| `errorCorrectLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |
| `size` | `number` | `500` | Image edge length in px — a target value, see below |
| `colorDark` | `string` | `'#000000'` | Module color, `#RRGGBB` or `#RGB` |
| `colorLight` | `string` | `'#ffffff'` | Background color, same format; use `'transparent'` for a transparent background |

`typeNumber` counts modules, `size` counts pixels — the two are unrelated.

## What `size` actually resolves to

Every module must occupy a whole number of pixels. A fractional value distorts the finder patterns' `1:1:3:1:1` ratio through rounding, and since a decoder recovers the sampling grid *from those patterns*, the error drifts module by module — on dense content up to 20% of modules get sampled wrong, well past what error correction can recover. The result simply does not scan.

So `size` is a target. The actual edge length is `moduleCount × cellsize`, where `cellsize = max(2, round(size / moduleCount))`:

```
QR.drawImg('github.com/pudon', { size: 500 })   →   33 modules × 15px = 495px
QR.drawImg('文'.repeat(240), { size: 170 })     →  105 modules ×  2px = 210px
```

Use CSS to control the displayed size when you need exact dimensions. Modules fill the image edge to edge — there is no quiet zone, so add `padding` and a background color on a wrapper if you need one.

Longer content means more modules, which means a larger size is required. For k pixels per module, pass `size ≥ moduleCount × k`; k of 3 or above is recommended.

## TypeScript

Type declarations are bundled — no separate `@types` package required.

```ts
import QR, { type DrawImgOptions } from 'qrcode-base64';

const opts: DrawImgOptions = { size: 500, errorCorrectLevel: 'H', colorDark: '#c0392b' };
const url: string = QR.drawImg('github.com/pudon', opts);
```
