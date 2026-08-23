<script setup>
import { ref, computed } from 'vue';
import { drawImg } from 'qrcode-base64';

const text = ref('https://github.com/pudon');
const errorCorrectLevel = ref('M');
const size = ref(500);
const colorDark = ref('#000000');
const colorLight = ref('#ffffff');
const copied = ref(false);

const levels = [
  { value: 'L', label: 'L · 7%' },
  { value: 'M', label: 'M · 15%' },
  { value: 'Q', label: 'Q · 25%' },
  { value: 'H', label: 'H · 30%' }
];

// drawImg 直接输出 PNG data URL（无需 canvas）
const qrcodeURL = computed(() => {
  const content = text.value.trim() || '';
  try {
    return drawImg( {
      text: content,
      typeNumber: 4,
      errorCorrectLevel: errorCorrectLevel.value,
      size: size.value,
      colorDark: colorDark.value,
      colorLight: colorLight.value
    });
  } catch (e) {
    console.error(e);
    return '';
  }
});

const failed = computed(() => qrcodeURL.value === '');
// 失败原因只有两种：内容为空 / 内容超出 typeNumber 40 的容量，按输入区分提示
const failedHint = computed(() =>
  text.value.trim() ? '文本过长，无法生成' : '请输入要编码的内容'
);

// 默认值与 drawImg 内部保持一致：只把改过的项写进代码，全默认时退化成 QR.drawImg(text)
const DEFAULTS = {
  errorCorrectLevel: 'M',
  size: 500,
  colorDark: '#000000',
  colorLight: '#ffffff'
};

// 文本可能含引号或换行，含特殊字符时交给 JSON.stringify 转义，否则用单引号更合 JS 习惯
function quote(s) {
  return /['\\\n\r\t]/.test(s) ? JSON.stringify(s) : `'${s}'`;
}

const codeSnippet = computed(() => {
  const content = quote(text.value.trim());
  const opts = [];
  if (errorCorrectLevel.value !== DEFAULTS.errorCorrectLevel) {
    opts.push(`errorCorrectLevel: '${errorCorrectLevel.value}'`);
  }
  if (size.value !== DEFAULTS.size) {
    opts.push(`size: ${size.value}`);
  }
  if (colorDark.value.toLowerCase() !== DEFAULTS.colorDark) {
    opts.push(`colorDark: '${colorDark.value}'`);
  }
  if (colorLight.value.toLowerCase() !== DEFAULTS.colorLight) {
    opts.push(`colorLight: '${colorLight.value}'`);
  }

  const head = "import QR from 'qrcode-base64';\n\n";
  if (!opts.length) {
    return `${head}const url = QR.drawImg(${content});`;
  }
  const body = [`text: ${content}`]
    .concat(opts)
    .map((line) => `  ${line}`)
    .join(',\n');
  return `${head}const url = QR.drawImg({\n${body}\n});`;
});

const codeCopied = ref(false);

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeSnippet.value);
    codeCopied.value = true;
    setTimeout(() => (codeCopied.value = false), 1500);
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

function download() {
  if (failed.value) return;
  const a = document.createElement('a');
  a.href = qrcodeURL.value;
  a.download = `qrcode-${Date.now()}.png`;
  a.click();
}

async function copy() {
  if (failed.value) return;
  try {
    await navigator.clipboard.writeText(qrcodeURL.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}
</script>

<template>
  <main class="page">
    <header class="header">
      <h1>qrcode-base64</h1>
      <p>base64 二维码生成 · Vue 3 示例（无 canvas 依赖，支持小程序 / Node / 浏览器）</p>
    </header>

    <section class="grid">
      <div class="card preview">
        <div class="card-title">预览</div>
        <div class="preview-box">
          <img v-if="!failed" class="qr" :src="qrcodeURL" :alt="text" />
          <span v-else class="empty">{{ failedHint }}</span>
        </div>
        <div class="preview-actions">
          <button class="btn primary" :disabled="failed" @click="download">
            下载 PNG
          </button>
          <button class="btn" :disabled="failed" @click="copy">
            {{ copied ? '已复制' : '复制 base64' }}
          </button>
        </div>
      </div>

      <div class="card control">
        <div class="card-title">参数</div>

        <label class="field">
          <span class="field-label">内容</span>
          <textarea
            v-model="text"
            rows="3"
            placeholder="输入要编码的文本，支持中文 / Emoji"
          ></textarea>
        </label>

        <div class="field">
          <span class="field-label">纠错等级</span>
          <div class="seg">
            <button
              v-for="l in levels"
              :key="l.value"
              class="seg-btn"
              :class="{ active: errorCorrectLevel === l.value }"
              @click="errorCorrectLevel = l.value"
            >
              {{ l.label }}
            </button>
          </div>
        </div>

        <label class="field">
          <span class="field-label">图片尺寸：{{ size }} px</span>
          <input
            type="range"
            min="120"
            max="1000"
            step="10"
            v-model.number="size"
          />
        </label>

        <div class="field">
          <span class="field-label">颜色</span>
          <div class="colors">
            <label class="color-row">
              <input type="color" v-model="colorDark" class="color-picker" />
              <span class="color-text">
                <span class="color-key">前景（码点）</span>
                <span class="color-value">{{ colorDark }}</span>
              </span>
            </label>
            <label class="color-row">
              <input type="color" v-model="colorLight" class="color-picker" />
              <span class="color-text">
                <span class="color-key">背景（底）</span>
                <span class="color-value">{{ colorLight }}</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div class="card code">
        <div class="card-head">
          <div class="card-title">调用代码</div>
          <button class="btn small" @click="copyCode">
            {{ codeCopied ? '已复制' : '复制代码' }}
          </button>
        </div>
        <pre class="snippet"><code>{{ codeSnippet }}</code></pre>
        <p class="code-note">只列出与默认值不同的参数，全部默认时直接传文本。</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}

.header h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.header p {
  margin: 0 0 28px;
  color: var(--text-muted);
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  background: #fbfbfe;
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 20px;
}

.qr {
  width: 100%;
  max-width: 320px;
  height: auto;
  image-rendering: pixelated;
  border-radius: 4px;
}

.empty {
  color: var(--text-muted);
  font-size: 14px;
}

.preview-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.btn:hover:not(:disabled) {
  border-color: var(--primary);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  background: var(--primary-strong);
}

.field {
  display: block;
  margin-bottom: 20px;
}

.field:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  background: #fff;
  color: var(--text);
}

textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.seg {
  display: flex;
  gap: 8px;
}

.seg-btn {
  flex: 1;
  padding: 8px 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.seg-btn.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary-strong);
  font-weight: 600;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--primary);
}

.colors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}

.color-row:hover {
  border-color: var(--primary);
}

.color-picker {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.color-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  flex: 1;
  min-width: 0;
}

.color-key {
  color: var(--text-muted);
}

.color-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text);
}

.card.code {
  grid-column: 1 / -1;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.card-head .card-title {
  margin-bottom: 0;
}

.btn.small {
  flex: 0 0 auto;
  padding: 6px 14px;
  font-size: 13px;
}

.snippet {
  margin: 0;
  padding: 16px;
  background: #fbfbfe;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
}

.code-note {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .preview-box {
    min-height: 240px;
  }
}
</style>
