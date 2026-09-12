// Type definitions for qrcode-base64

/** 纠错等级 */
export type ErrorCorrectLevel = 'L' | 'M' | 'Q' | 'H';

export interface DrawImgOptions {
  /** 编码内容。仅在单参形式 `drawImg(options)` 下生效；`drawImg(text, options)` 形式下被忽略 */
  text?: string;
  /** QR 版本号 1–40，决定模块数（`版本 × 4 + 17`）与容量，与像素尺寸无关。装不下会自动升级。默认 4 */
  typeNumber?: number;
  /** 纠错等级，默认 'M' */
  errorCorrectLevel?: ErrorCorrectLevel;
  /**
   * 图片边长（px），目标值。实际边长 = `模块数 × max(2, round(size / 模块数))`，
   * 每模块须占整数像素否则扫不出。默认 500（→ 33 模块 × 15px = 495px）
   */
  size?: number;
  /** 码点颜色，'#RRGGBB' 或 '#RGB'，默认 '#000000' */
  colorDark?: string;
  /** 背景色，格式同上，默认 '#ffffff'；传 'transparent' 可生成透明背景 */
  colorLight?: string;
}

/** 生成二维码，返回 data:image/png;base64,... 字符串 */
export function drawImg(text: string, options?: DrawImgOptions): string;
/** 生成二维码（单参形式），内容取 `options.text` */
export function drawImg(options: DrawImgOptions & { text: string }): string;

declare const _default: {
  drawImg: typeof drawImg;
};
export default _default;
