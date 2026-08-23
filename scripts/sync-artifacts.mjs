// 构建后同步（唯一来源是 dist/）：
// 类型声明 → dist（npm 发布的 files 只含 dist）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const copy = function (from, to, missingHint) {
  if (!fs.existsSync(from)) {
    console.error(missingHint, path.relative(root, from));
    process.exit(1);
  }
  fs.copyFileSync(from, to);
  console.log('synced →', path.relative(root, to));
};

copy(
  path.join(root, 'types', 'qrcode-base64.d.ts'),
  path.join(root, 'dist', 'qrcode-base64.d.ts'),
  '缺少类型声明文件：'
);
