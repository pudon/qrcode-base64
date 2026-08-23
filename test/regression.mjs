// 校验 drawImg 输出是合法且确定的 PNG：签名 / chunk 结构 / CRC32 / 可解压 / 尺寸自洽 / 两次调用一致
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const require = createRequire(import.meta.url);
const modern = require(path.join(root, 'dist', 'qrcode-base64.cjs'));

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// crc32，与产物交叉校验
const CRC_TABLE = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function validatePng(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    return { ok: false, reason: '前缀不是 data:image/png;base64,' };
  }
  const bytes = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
  for (let i = 0; i < 8; i += 1) {
    if (bytes[i] !== PNG_SIG[i]) return { ok: false, reason: 'PNG 签名错误' };
  }
  let off = 8;
  let idat = null;
  let ihdr = null;
  const seen = [];
  while (off < bytes.length) {
    const len = bytes.readUInt32BE(off);
    const type = bytes.toString('ascii', off + 4, off + 8);
    const data = bytes.slice(off + 8, off + 8 + len);
    const crc = bytes.readUInt32BE(off + 8 + len);
    if (crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])) !== crc) {
      return { ok: false, reason: `chunk ${type} CRC32 错误` };
    }
    seen.push(type);
    if (type === 'IHDR') ihdr = data;
    if (type === 'IDAT') idat = data;
    off += 12 + len;
    if (type === 'IEND') break;
  }
  if (seen[0] !== 'IHDR' || seen[seen.length - 1] !== 'IEND' || !idat || !ihdr) {
    return { ok: false, reason: 'chunk 结构不完整（需 IHDR...IDAT...IEND）' };
  }
  let raw;
  try {
    raw = zlib.inflateSync(idat);
  } catch (e) {
    return { ok: false, reason: 'IDAT 解压失败: ' + e.message };
  }
  // 以 IHDR 声明的尺寸为准（size 只是目标值），校验扫描行字节数与之自洽
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  if (width !== height) {
    return { ok: false, reason: `IHDR 非正方形 ${width}×${height}` };
  }
  const expected = height * (1 + Math.ceil(width / 8));
  if (raw.length !== expected) {
    return { ok: false, reason: `解压字节数 ${raw.length} != 期望 ${expected}` };
  }
  return { ok: true, width };
}

// [text, options, 请求的 size]
const cases = [
  ['github.com/pudon', { typeNumber: 4, errorCorrectLevel: 'M', size: 500 }, 500],
  [
    'https://example.com?query=hello&lang=zh-CN',
    { typeNumber: 4, errorCorrectLevel: 'M', size: 300 },
    300
  ],
  ['中文内容测试：你好世界！', { typeNumber: 4, errorCorrectLevel: 'H', size: 500 }, 500],
  ['emoji ☃ and symbols ★☆', { typeNumber: 4, errorCorrectLevel: 'L', size: 200 }, 200],
  // 长文本触发 typeNumber 自动升级
  ['L'.repeat(500), { typeNumber: 4, errorCorrectLevel: 'M', size: 500 }, 500],
  [
    '混合 mixed 内容 1234567890abcdefghijklmnopqrstuvwxyz'.repeat(3),
    { errorCorrectLevel: 'Q', size: 600 },
    600
  ],
  ['default options', null, 500],
  // 密集内容 + 小 size：cellsize 抬到下限 2，实际边长大于请求值
  ['文'.repeat(240), { size: 170 }, 170]
];

let failed = 0;
for (const [text, options, requestedSize] of cases) {
  const label = JSON.stringify(text.slice(0, 24)) + (text.length > 24 ? '…' : '');
  let out;
  try {
    out = modern.drawImg(text, options);
  } catch (e) {
    failed += 1;
    console.log(`FAIL  ${label}  调用抛错: ${e.message}`);
    continue;
  }

  const v = validatePng(out);
  if (!v.ok) {
    failed += 1;
    console.log(`FAIL  ${label}  ${v.reason}`);
    continue;
  }

  // 确定性：同一输入两次调用必须完全一致
  const again = modern.drawImg(text, options);
  if (again !== out) {
    failed += 1;
    console.log(`FAIL  ${label}  两次调用输出不一致`);
    continue;
  }

  const note = v.width === requestedSize ? '' : ` ← 请求 ${requestedSize}px`;
  console.log(`PASS  ${label}  (${out.length} chars, PNG ${v.width}px${note})`);
}

if (failed > 0) {
  console.error(`\n${failed} 个用例失败`);
  process.exit(1);
}
console.log('\n全部用例通过：drawImg 输出均为合法 PNG 且结果确定一致');
