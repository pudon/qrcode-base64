# qrcode-base64

[English](https://github.com/pudon/qrcode-base64/blob/master/README.md) | 简体中文

**[在线演示 →](https://pudon.github.io/qrcode-base64/)**

生成 base64 编码的二维码，不依赖 canvas，零运行时依赖。可用于 Vue2 / Vue3 / React / 微信小程序 / Node / 浏览器等。

`drawImg(text)` 返回 `data:image/png;base64,...` 字符串，直接给 `<image>` / `<img>` 当 src 用。

## 安装

```bash
npm install qrcode-base64
```

## 使用

```js
import QR from 'qrcode-base64';
// 或：import { drawImg } from 'qrcode-base64'  →  drawImg(...)

const url = QR.drawImg('github.com/pudon', { size: 500 });

// 也可以只传一个 options 对象，内容写在 text 里：
const url2 = QR.drawImg({
  text: 'github.com/pudon',
  size: 500
});
```

CommonJS：

```js
const QR = require('qrcode-base64');

const url = QR.drawImg('github.com/pudon', { size: 500 });
```

UMD，全局名 `QRCode`：

```html
<script src="https://unpkg.com/qrcode-base64/dist/qrcode-base64.umd.js"></script>
<script>
  const url = QRCode.drawImg('Hello', { size: 300 });
</script>
```

## 参数

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | — | 编码内容，支持中文 / Emoji（UTF-8）。只在单参形式 `drawImg(options)` 下生效，`drawImg(text, options)` 形式下以第一个参数为准、忽略此字段 |
| `typeNumber` | `number` | `4` | QR 版本号 1–40，决定模块数（`版本 × 4 + 17`）与容量。装不下会自动升级，一般不用设 |
| `errorCorrectLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | 纠错等级 |
| `size` | `number` | `500` | 图片边长（px），目标值，见下 |
| `colorDark` | `string` | `'#000000'` | 码点颜色，`#RRGGBB` 或 `#RGB` |
| `colorLight` | `string` | `'#ffffff'` | 背景色，格式同上；传 `'transparent'` 可生成透明背景 |

`typeNumber` 是格子数，`size` 是像素数，两者无关。

## size 的实际取值

每个模块必须占整数像素。带小数时定位图形的 `1:1:3:1:1` 会被舍入扭曲，扫码器由它反推网格时逐模块漂移，密集内容下错误率可达 20%，超出纠错能力，结果是扫不出来。

所以 `size` 是目标值，实际边长为 `模块数 × cellsize`，其中 `cellsize = max(2, round(size / 模块数))`：

```
QR.drawImg('github.com/pudon', { size: 500 })   →   33 模块 × 15px = 495px
QR.drawImg('文'.repeat(240), { size: 170 })     →  105 模块 ×  2px = 210px
```

需要精确尺寸就用 CSS 控制显示大小。图片里码点铺满，不含静区（quiet zone），需要静区在外层加 `padding` + 背景色。

内容越长模块数越多，所需尺寸也越大。想要每模块 k 像素就取 `size ≥ 模块数 × k`，k 建议 3 以上。

## TypeScript

内置类型声明，无需额外安装 `@types`。

```ts
import QR, { type DrawImgOptions } from 'qrcode-base64';

const opts: DrawImgOptions = { size: 500, errorCorrectLevel: 'H', colorDark: '#c0392b' };
const url: string = QR.drawImg('github.com/pudon', opts);
```
