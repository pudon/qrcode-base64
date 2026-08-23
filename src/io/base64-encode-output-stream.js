var base64EncodeOutputStream = function () {
  var _buffer = 0;
  var _buflen = 0;
  var _length = 0;
  var _base64 = '';

  var _this = {};

  var writeEncoded = function (b) {
    _base64 += String.fromCharCode(encode(b & 0x3f));
  };

  var encode = function (n) {
    if (n < 0) {
      // error.
    } else if (n < 26) {
      return 0x41 + n;
    } else if (n < 52) {
      return 0x61 + (n - 26);
    } else if (n < 62) {
      return 0x30 + (n - 52);
    } else if (n == 62) {
      return 0x2b;
    } else if (n == 63) {
      return 0x2f;
    }
    throw new Error('n:' + n);
  };

  _this.writeByte = function (n) {
    _buffer = (_buffer << 8) | (n & 0xff);
    _buflen += 8;
    _length += 1;

    while (_buflen >= 6) {
      writeEncoded(_buffer >>> (_buflen - 6));
      _buflen -= 6;
    }
  };

  _this.flush = function () {
    if (_buflen > 0) {
      writeEncoded(_buffer << (6 - _buflen));
      _buffer = 0;
      _buflen = 0;
    }

    if (_length % 3 != 0) {
      // padding
      var padlen = 3 - (_length % 3);
      for (var i = 0; i < padlen; i += 1) {
        _base64 += '=';
      }
    }
  };

  _this.toString = function () {
    return _base64;
  };

  return _this;
};

export default base64EncodeOutputStream;
