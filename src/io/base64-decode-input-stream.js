var base64DecodeInputStream = function (str) {
  var _str = str;
  var _pos = 0;
  var _buffer = 0;
  var _buflen = 0;

  var _this = {};

  _this.read = function () {
    while (_buflen < 8) {
      if (_pos >= _str.length) {
        if (_buflen == 0) {
          return -1;
        }
        throw new Error('unexpected end of file./' + _buflen);
      }

      var c = _str.charAt(_pos);
      _pos += 1;

      if (c == '=') {
        _buflen = 0;
        return -1;
      } else if (c.match(/^\s$/)) {
        // ignore if whitespace.
        continue;
      }

      _buffer = (_buffer << 6) | decode(c.charCodeAt(0));
      _buflen += 6;
    }

    var n = (_buffer >>> (_buflen - 8)) & 0xff;
    _buflen -= 8;
    return n;
  };

  var decode = function (c) {
    if (0x41 <= c && c <= 0x5a) {
      return c - 0x41;
    } else if (0x61 <= c && c <= 0x7a) {
      return c - 0x61 + 26;
    } else if (0x30 <= c && c <= 0x39) {
      return c - 0x30 + 52;
    } else if (c == 0x2b) {
      return 62;
    } else if (c == 0x2f) {
      return 63;
    } else {
      throw new Error('c:' + c);
    }
  };

  return _this;
};

export default base64DecodeInputStream;
