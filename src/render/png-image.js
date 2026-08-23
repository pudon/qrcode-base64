import byteArrayOutputStream from '../io/byte-array-output-stream.js';
import deflateFixed from './deflate-fixed.js';

// PNG 输出：1bit 索引色 + PLTE 调色板，DEFLATE 用 fixed-Huffman，零依赖
// 像素值 0 = 前景（码点），1 = 背景，对应 PLTE 索引 0 / 1

// '#RRGGBB' | '#RGB' -> [r,g,b]，非法值回退 fallback
var parseColor = function (color, fallback) {
  if (typeof color === 'string') {
    var hex = color.replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      return [
        parseInt(hex.charAt(0) + hex.charAt(0), 16),
        parseInt(hex.charAt(1) + hex.charAt(1), 16),
        parseInt(hex.charAt(2) + hex.charAt(2), 16)
      ];
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
  }
  return fallback;
};

var pngImage = function (width, height, colorDark, colorLight) {
  // 取整：new Array 不接受小数长度
  var _width = parseInt(width, 10);
  var _height = parseInt(height, 10);
  var _data = new Array(_width * _height);
  var _dark = parseColor(colorDark, [0, 0, 0]);
  var _light = parseColor(colorLight, [255, 255, 255]);

  var _this = {};

  _this.setPixel = function (x, y, pixel) {
    _data[y * _width + x] = pixel;
  };

  // CRC-32 查表（多项式 0xEDB88320）
  var CRC_TABLE = (function () {
    var t = new Array(256);
    for (var n = 0; n < 256; n += 1) {
      var c = n;
      for (var k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })();

  var crc32 = function (bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i += 1) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  };

  // Adler-32（zlib 尾校验）
  var adler32 = function (bytes) {
    var a = 1;
    var b = 0;
    for (var i = 0; i < bytes.length; i += 1) {
      a = (a + bytes[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  };

  var writeInt32BE = function (out, v) {
    out.writeByte((v >>> 24) & 0xff);
    out.writeByte((v >>> 16) & 0xff);
    out.writeByte((v >>> 8) & 0xff);
    out.writeByte(v & 0xff);
  };

  // chunk：length(4,BE) + type(4,ASCII) + data + crc32(type+data)
  var writeChunk = function (out, type, data) {
    writeInt32BE(out, data ? data.length : 0);
    out.writeString(type);
    if (data) {
      out.writeBytes(data);
    }
    var typeBytes = [];
    for (var i = 0; i < 4; i += 1) {
      typeBytes.push(type.charCodeAt(i));
    }
    writeInt32BE(out, crc32(typeBytes.concat(data || [])));
  };

  // 扫描行：每行 filter(0) + ceil(width/8) 字节，MSB first
  var getScanlines = function () {
    var rowBytes = Math.ceil(_width / 8);
    var raw = new Array(_height * (1 + rowBytes));
    var p = 0;
    for (var y = 0; y < _height; y += 1) {
      raw[p] = 0; // filter byte: None
      p += 1;
      for (var i = 0; i < rowBytes; i += 1) {
        var byte = 0;
        for (var bit = 0; bit < 8; bit += 1) {
          var x = i * 8 + bit;
          var v = x < _width ? _data[y * _width + x] & 1 : 0;
          byte |= v << (7 - bit);
        }
        raw[p] = byte;
        p += 1;
      }
    }
    return raw;
  };

  // zlib 流：78 01 + DEFLATE + adler32
  var getZlibStream = function (raw) {
    var out = byteArrayOutputStream();
    out.writeByte(0x78);
    out.writeByte(0x01);
    out.writeBytes(deflateFixed(raw));
    writeInt32BE(out, adler32(raw));
    return out.toByteArray();
  };

  _this.write = function (out) {
    // PNG 签名
    out.writeBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    var ihdr = byteArrayOutputStream();
    writeInt32BE(ihdr, _width);
    writeInt32BE(ihdr, _height);
    ihdr.writeByte(1); // bitDepth
    ihdr.writeByte(3); // colorType：索引色
    ihdr.writeByte(0); // compression
    ihdr.writeByte(0); // filter
    ihdr.writeByte(0); // interlace
    writeChunk(out, 'IHDR', ihdr.toByteArray());

    // 索引 0 = 前景，索引 1 = 背景
    writeChunk(out, 'PLTE', [
      _dark[0],
      _dark[1],
      _dark[2],
      _light[0],
      _light[1],
      _light[2]
    ]);

    writeChunk(out, 'IDAT', getZlibStream(getScanlines()));
    writeChunk(out, 'IEND', null);
  };

  return _this;
};

export default pngImage;
