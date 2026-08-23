// 零依赖 DEFLATE（RFC 1951）：只实现 fixed-Huffman 块（BTYPE=01）+ LZ77 哈希链
// 输入字节数组，输出压缩流（不含 zlib 头与 Adler-32 尾）

var WINDOW_SIZE = 32768;
var MIN_MATCH = 3;
var MAX_MATCH = 258;
var HASH_BITS = 15;
var HASH_SIZE = 1 << HASH_BITS;
var MAX_CHAIN = 256; // 哈希链搜索深度上限，平衡速度与压缩率

// fixed Huffman：字面量/长度符号 -> { code, bits }
function litLenCode(symbol) {
  if (symbol < 144) {
    return { code: 0x30 + symbol, bits: 8 };
  }
  if (symbol < 256) {
    return { code: 0x190 + (symbol - 144), bits: 9 };
  }
  if (symbol < 280) {
    return { code: symbol - 256, bits: 7 };
  }
  return { code: 0xc0 + (symbol - 280), bits: 8 };
}

// 长度（3-258）-> 长度符号 257-285 及 extra bits
var LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83,
  99, 115, 131, 163, 195, 227, 258
];
var LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0
];

function lengthToCode(length) {
  for (var s = LENGTH_BASE.length - 1; s >= 0; s -= 1) {
    if (length >= LENGTH_BASE[s]) {
      return {
        symbol: 257 + s,
        extra: LENGTH_EXTRA[s],
        extraValue: length - LENGTH_BASE[s]
      };
    }
  }
  return null;
}

// 距离（1-32768）-> 距离码 0-29 及 extra bits
var DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
  1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577
];
var DIST_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13
];

function distToCode(distance) {
  for (var c = DIST_BASE.length - 1; c >= 0; c -= 1) {
    if (distance >= DIST_BASE[c]) {
      return {
        code: c,
        extra: DIST_EXTRA[c],
        extraValue: distance - DIST_BASE[c]
      };
    }
  }
  return null;
}

export default function deflateFixed(data) {
  var len = data.length;
  var out = [];
  var bitBuffer = 0;
  var bitCount = 0;

  // LSB-first 填充字节（用于块头与 extra bits）
  function writeBits(value, length) {
    bitBuffer |= value << bitCount;
    bitCount += length;
    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  }

  // Huffman 码按 MSB-first 发送：反转位序后走 LSB-first 写入
  function writeHuffman(code, bits) {
    var rev = 0;
    for (var i = 0; i < bits; i += 1) {
      rev = (rev << 1) | ((code >>> i) & 1);
    }
    writeBits(rev, bits);
  }

  function hashAt(pos) {
    return ((data[pos] << 10) ^ (data[pos + 1] << 5) ^ data[pos + 2]) & (HASH_SIZE - 1);
  }

  var head = new Array(HASH_SIZE).fill(-1);
  var prev = new Array(len).fill(-1);

  // 块头：BFINAL=1，BTYPE=01（fixed Huffman）
  writeBits(1, 1);
  writeBits(1, 2);

  var pos = 0;
  while (pos < len) {
    var bestLen = 0;
    var bestDist = 0;

    if (pos + MIN_MATCH <= len) {
      var h = hashAt(pos);
      var cand = head[h];
      var chain = MAX_CHAIN;
      var maxPossible = Math.min(MAX_MATCH, len - pos);

      while (cand >= 0 && chain > 0) {
        chain -= 1;
        var dist = pos - cand;
        if (dist > WINDOW_SIZE) {
          break;
        }
        // 快速失败：先比对待扩展位置的下一个字节
        if (bestLen === 0 || data[cand + bestLen] === data[pos + bestLen]) {
          var l = 0;
          while (l < maxPossible && data[cand + l] === data[pos + l]) {
            l += 1;
          }
          if (l > bestLen) {
            bestLen = l;
            bestDist = dist;
            if (l >= maxPossible) {
              break;
            }
          }
        }
        cand = prev[cand];
      }
    }

    if (bestLen >= MIN_MATCH) {
      // 发出长度码 + 距离码
      var lc = lengthToCode(bestLen);
      var lcode = litLenCode(lc.symbol);
      writeHuffman(lcode.code, lcode.bits);
      if (lc.extra > 0) {
        writeBits(lc.extraValue, lc.extra);
      }
      var dc = distToCode(bestDist);
      writeHuffman(dc.code, 5);
      if (dc.extra > 0) {
        writeBits(dc.extraValue, dc.extra);
      }

      // 把匹配覆盖的位置都登记进哈希链
      var end = pos + bestLen;
      for (var p = pos; p < end; p += 1) {
        if (p + MIN_MATCH <= len) {
          var hh = hashAt(p);
          prev[p] = head[hh];
          head[hh] = p;
        }
      }
      pos = end;
    } else {
      // 发出字面量
      var code = litLenCode(data[pos]);
      writeHuffman(code.code, code.bits);
      if (pos + MIN_MATCH <= len) {
        var h2 = hashAt(pos);
        prev[pos] = head[h2];
        head[h2] = pos;
      }
      pos += 1;
    }
  }

  // 块结束符号
  var eob = litLenCode(256);
  writeHuffman(eob.code, eob.bits);

  if (bitCount > 0) {
    out.push(bitBuffer & 0xff);
  }

  return out;
}
