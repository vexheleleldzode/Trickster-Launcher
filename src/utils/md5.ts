// Standard pure TypeScript MD5 hashing implementation for accurate file checksums
export function md5(stringOrBuffer: string | Uint8Array): string {
  function toUtf8Array(str: string): number[] {
    const utf8: number[] = [];
    for (let i = 0; i < str.length; i++) {
      let charcode = str.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
      } else {
        i++;
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        utf8.push(
          0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        );
      }
    }
    return utf8;
  }

  const bytes: number[] = typeof stringOrBuffer === 'string'
    ? toUtf8Array(stringOrBuffer)
    : Array.from(stringOrBuffer);

  const originalLengthBits = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  for (let i = 0; i < 8; i++) {
    bytes.push((originalLengthBits >>> (i * 8)) & 0xff);
  }

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  const S = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21
  ];

  function leftRotate(x: number, c: number) {
    return (x << c) | (x >>> (32 - c));
  }

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const M: number[] = new Array(16);
    for (let i = 0; i < 16; i++) {
      M[i] = bytes[chunk + i * 4] |
        (bytes[chunk + i * 4 + 1] << 8) |
        (bytes[chunk + i * 4 + 2] << 16) |
        (bytes[chunk + i * 4 + 3] << 24);
    }

    let A = a;
    let B = b;
    let C = c;
    let D = d;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;

      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      const temp = D;
      D = C;
      C = B;
      B = (B + leftRotate((A + F + K[i] + M[g]) >>> 0, S[i])) >>> 0;
      A = temp;
    }

    a = (a + A) >>> 0;
    b = (b + B) >>> 0;
    c = (c + C) >>> 0;
    d = (d + D) >>> 0;
  }

  function toHex(val: number): string {
    let s = '';
    for (let i = 0; i < 4; i++) {
      const byte = (val >>> (i * 8)) & 0xff;
      s += byte.toString(16).padStart(2, '0');
    }
    return s;
  }

  return (toHex(a) + toHex(b) + toHex(c) + toHex(d)).toLowerCase();
}
