import pngImage from './png-image.js';
import byteArrayOutputStream from '../io/byte-array-output-stream.js';
import base64EncodeOutputStream from '../io/base64-encode-output-stream.js';

// 生成 data:image/png;base64,... 数据（colors: { dark, light } 可选）
var createImgTag = function (width, height, getPixel, colors) {
  var image = pngImage(width, height, colors && colors.dark, colors && colors.light);
  for (var y = 0; y < height; y += 1) {
    for (var x = 0; x < width; x += 1) {
      image.setPixel(x, y, getPixel(x, y));
    }
  }

  var b = byteArrayOutputStream();
  image.write(b);

  var base64 = base64EncodeOutputStream();
  var bytes = b.toByteArray();
  for (var i = 0; i < bytes.length; i += 1) {
    base64.writeByte(bytes[i]);
  }
  base64.flush();

  var img = '';
  img += 'data:image/png;base64,';
  img += base64;

  return img;
};

export default createImgTag;
