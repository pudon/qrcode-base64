import qrcode from '../core/qrcode.js';

// 对外主 API，返回 data:image/png;base64,... 字符串。两种调用形式等价：
//   drawImg(text, options) —— 首参为字符串
//   drawImg(options)       —— 首参为对象，内容取 options.text
// 首参是字符串时以它为准，options.text 被忽略。
var drawImg = function (text, options) {
  if (text != null && typeof text == 'object') {
    options = text;
    text = options.text;
  } else {
    options = options || {};
  }
  // 空内容一律拦在前面：null/undefined 会让 addData 抛 TypeError 被下面的 catch 吞掉，
  // 一路递归到 typeNumber 40 才以 'Text too long to encode' 结束，错得看不出真因；
  // 空字符串则静默产出一张扫出来是空的图。两者都是调用方漏传，早报错好过晚误报。
  if (!text) {
    throw new Error('Missing text to encode');
  }

  var typeNumber = options.typeNumber || 4;
  var errorCorrectLevel = options.errorCorrectLevel || 'M';
  // 取整并兜底 500：new Array 不接受小数长度，负数会静默产出空白图
  var size = parseInt(options.size, 10);
  if (!(size > 0)) {
    size = 500;
  }

  var colors = {
    dark: options.colorDark,
    light: options.colorLight
  };

  var qr;

  try {
    qr = qrcode(typeNumber, errorCorrectLevel || 'M');
    qr.addData(text);
    qr.make();
  } catch (e) {
    if (typeNumber >= 40) {
      throw new Error('Text too long to encode');
    } else {
      // 用单参形式递归：text 走 options.text，不会被当成 options 二次解释
      return drawImg({
        text: text,
        size: size,
        errorCorrectLevel: errorCorrectLevel,
        typeNumber: typeNumber + 1,
        colorDark: options.colorDark,
        colorLight: options.colorLight
      });
    }
  }

  // cellsize 必须取整：带小数时定位图形的 1:1:3:1:1 被舍入扭曲，解码器反推
  // 网格会逐模块漂移（105 模块 @170px 错 19.6%）而扫不出。故 size 只是目标值，
  // 实际边长 = moduleCount * cellsize；下限 2 避免密集内容产出无法识别的图。
  var moduleCount = qr.getModuleCount();
  var cellsize = Math.round(size / moduleCount);
  if (cellsize < 2) {
    cellsize = 2;
  }

  return qr.createImgTag(cellsize, 0, moduleCount * cellsize, colors);
};

export default drawImg;
