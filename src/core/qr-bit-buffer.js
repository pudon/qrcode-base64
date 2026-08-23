var qrBitBuffer = function () {
  var _buffer = new Array();
  var _length = 0;

  var _this = {};

  _this.getBuffer = function () {
    return _buffer;
  };

  _this.getAt = function (index) {
    var bufIndex = Math.floor(index / 8);
    return ((_buffer[bufIndex] >>> (7 - (index % 8))) & 1) == 1;
  };

  _this.put = function (num, length) {
    for (var i = 0; i < length; i += 1) {
      _this.putBit(((num >>> (length - i - 1)) & 1) == 1);
    }
  };

  _this.getLengthInBits = function () {
    return _length;
  };

  _this.putBit = function (bit) {
    var bufIndex = Math.floor(_length / 8);
    if (_buffer.length <= bufIndex) {
      _buffer.push(0);
    }

    if (bit) {
      _buffer[bufIndex] |= 0x80 >>> (_length % 8);
    }

    _length += 1;
  };

  return _this;
};

export default qrBitBuffer;
