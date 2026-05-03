/**
 * SM2 密文编解码工具集
 * - ASN.1 DER 编解码 (GM/T 0003.4-2012)
 * - 点序列化模式 (非压缩/压缩/混合)
 */

import { sm2 } from 'sm-crypto'

// ========== 基础工具 ==========

function leftPad(input, num) {
  if (input.length >= num) return input
  return (new Array(num - input.length + 1)).join('0') + input
}

// ========== ASN.1 DER 编解码 ==========

function derEncodeLength(len) {
  if (len < 0x80) {
    return len.toString(16).padStart(2, '0')
  } else {
    const lenHex = len.toString(16)
    const numLenBytes = Math.ceil(lenHex.length / 2)
    return (0x80 + numLenBytes).toString(16).padStart(2, '0') +
      lenHex.padStart(numLenBytes * 2, '0')
  }
}

function derDecodeLength(hex, offset) {
  const first = parseInt(hex.substr(offset, 2), 16)
  if (first < 0x80) {
    return { length: first, nextOffset: offset + 2 }
  } else {
    const numLenBytes = first & 0x7f
    const length = parseInt(hex.substr(offset + 2, numLenBytes * 2), 16)
    return { length, nextOffset: offset + 2 + numLenBytes * 2 }
  }
}

function derEncodeInteger(hex) {
  if (hex.length % 2 !== 0) hex = '0' + hex
  const firstByte = parseInt(hex.substr(0, 2), 16)
  if (firstByte >= 0x80) hex = '00' + hex
  const lenBytes = hex.length / 2
  return '02' + derEncodeLength(lenBytes) + hex
}

function derEncodeOctetString(hex) {
  if (hex.length % 2 !== 0) hex = '0' + hex
  const lenBytes = hex.length / 2
  return '04' + derEncodeLength(lenBytes) + hex
}

/**
 * 将 SM2 加密的各部分编码为 ASN.1 DER 格式
 * SM2Cipher ::= SEQUENCE { INTEGER(x), INTEGER(y), OCTET STRING(hash), OCTET STRING(cipher) }
 */
export function sm2EncodeAsn1(c1x, c1y, c3, c2) {
  const derX = derEncodeInteger(c1x)
  const derY = derEncodeInteger(c1y)
  const derHash = derEncodeOctetString(c3)
  const derCipher = derEncodeOctetString(c2)
  const inner = derX + derY + derHash + derCipher
  const innerLen = inner.length / 2
  return '30' + derEncodeLength(innerLen) + inner
}

/**
 * 从 ASN.1 DER 格式解析 SM2 密文各部分
 */
export function sm2DecodeAsn1(asn1Hex) {
  let pos = 0

  if (asn1Hex.substr(pos, 2) !== '30') {
    throw new Error('ASN.1 解析错误：期望 SEQUENCE')
  }
  pos += 2
  const seqLen = derDecodeLength(asn1Hex, pos)
  pos = seqLen.nextOffset

  // C1.x
  if (asn1Hex.substr(pos, 2) !== '02') throw new Error('ASN.1 解析错误：期望 INTEGER for C1.x')
  pos += 2
  const xLen = derDecodeLength(asn1Hex, pos)
  pos = xLen.nextOffset
  let c1x = asn1Hex.substr(pos, xLen.length * 2)
  pos += xLen.length * 2
  c1x = c1x.replace(/^00/, '')

  // C1.y
  if (asn1Hex.substr(pos, 2) !== '02') throw new Error('ASN.1 解析错误：期望 INTEGER for C1.y')
  pos += 2
  const yLen = derDecodeLength(asn1Hex, pos)
  pos = yLen.nextOffset
  let c1y = asn1Hex.substr(pos, yLen.length * 2)
  pos += yLen.length * 2
  c1y = c1y.replace(/^00/, '')

  // C3
  if (asn1Hex.substr(pos, 2) !== '04') throw new Error('ASN.1 解析错误：期望 OCTET STRING for C3')
  pos += 2
  const hashLen = derDecodeLength(asn1Hex, pos)
  pos = hashLen.nextOffset
  const c3 = asn1Hex.substr(pos, hashLen.length * 2)
  pos += hashLen.length * 2

  // C2
  if (asn1Hex.substr(pos, 2) !== '04') throw new Error('ASN.1 解析错误：期望 OCTET STRING for C2')
  pos += 2
  const cipherLen = derDecodeLength(asn1Hex, pos)
  pos = cipherLen.nextOffset
  const c2 = asn1Hex.substr(pos, cipherLen.length * 2)

  return { c1x, c1y, c3, c2 }
}

// ========== 点序列化模式 ==========

/**
 * 压缩 C1 点
 * @param {string} c1x - x坐标 (64字符hex)
 * @param {string} c1y - y坐标 (64字符hex)
 * @param {string} mode - 'compressed' | 'hybrid'
 * @returns {string} 压缩后的C1 hex
 */
export function compressC1Point(c1x, c1y, mode) {
  const y = window.BigInt ? BigInt('0x' + c1y) : null
  let yIsEven
  if (y !== null) {
    yIsEven = y % 2n === 0n
  } else {
    // fallback: 检查最后一个hex字符
    yIsEven = parseInt(c1y.slice(-1), 16) % 2 === 0
  }

  if (mode === 'compressed') {
    const prefix = yIsEven ? '02' : '03'
    return prefix + c1x
  } else if (mode === 'hybrid') {
    const prefix = yIsEven ? '06' : '07'
    return prefix + c1x + c1y
  }
  // uncompressed fallback
  return '04' + c1x + c1y
}

/**
 * 解压缩 C1 点，还原为 x + y
 * 利用 sm-crypto 的曲线运算从 x 计算 y
 * @param {string} c1Hex - 压缩格式的C1
 * @returns {{ c1x: string, c1y: string }}
 */
export function decompressC1Point(c1Hex) {
  // 去掉可能存在的 04/02/03/06/07 前缀来判断格式
  const prefix = c1Hex.substring(0, 2)

  if (prefix === '04') {
    // 非压缩：04 + x(64) + y(64)
    const raw = c1Hex.substring(2)
    return { c1x: raw.substring(0, 64), c1y: raw.substring(64, 128) }
  }

  if (prefix === '06' || prefix === '07') {
    // 混合：06/07 + x(64) + y(64)
    const raw = c1Hex.substring(2)
    return { c1x: raw.substring(0, 64), c1y: raw.substring(64, 128) }
  }

  if (prefix === '02' || prefix === '03') {
    // 压缩：02/03 + x(64)，需要从 x 计算 y
    const xHex = c1Hex.substring(2)
    // 使用 sm2 的曲线来解压
    const fullPoint = decompressPointFromCurve(c1Hex)
    return { c1x: xHex, c1y: fullPoint.y }
  }

  // 无前缀，假设是原始拼接 128 字符
  if (c1Hex.length === 128) {
    return { c1x: c1Hex.substring(0, 64), c1y: c1Hex.substring(64) }
  }

  throw new Error('无法识别的 C1 点格式')
}

/**
 * 利用 sm-crypto 曲线从压缩公钥还原完整点
 */
function decompressPointFromCurve(compressedHex) {
  // sm-crypto 的 generateKeyPairHex 导出的公钥是 04 + x + y 格式
  // 我们需要利用曲线方程 y² = x³ + ax + b (mod p) 从 x 计算 y
  // 通过访问 sm-crypto 内部的 curve 对象

  // 构造完整公钥让 sm-crypto 的 curve 解析
  // 由于 sm-crypto 的 doDecrypt 内部使用 '04' + c1 来解码点
  // 我们可以利用这个特性：传入压缩格式，让 curve.decodePointHex 处理

  // 但 sm-crypto 内部的 decodePointHex 可能不支持压缩格式
  // 所以我们手动实现解压

  const prefix = compressedHex.substring(0, 2)
  const xHex = compressedHex.substring(2)

  // SM2 曲线参数
  const pHex = 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF'
  const aHex = 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC'
  const bHex = '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93'

  // 使用 BigInt 计算
  const p = BigInt('0x' + pHex)
  const a = BigInt('0x' + aHex)
  const b = BigInt('0x' + bHex)
  const x = BigInt('0x' + xHex)

  // y² = x³ + ax + b (mod p)
  let y2 = (x * x * x + a * x + b) % p
  if (y2 < 0n) y2 += p

  // 计算模平方根（p ≡ 3 mod 4 时，y = y^((p+1)/4) mod p）
  const exp = (p + 1n) / 4n
  let y = modPow(y2, exp, p)

  // 根据前缀选择正确的 y 值
  const yIsEven = y % 2n === 0n
  const wantEven = prefix === '02' || prefix === '06'

  if (yIsEven !== wantEven) {
    y = p - y
  }

  return {
    x: leftPad(xHex, 64),
    y: leftPad(y.toString(16), 64)
  }
}

/**
 * 模幂运算: base^exp mod m
 */
function modPow(base, exp, m) {
  let result = 1n
  base = base % m
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % m
    }
    exp = exp / 2n
    base = (base * base) % m
  }
  return result
}

// ========== 加密/解密封装 ==========

/**
 * SM2 加密（完整封装）
 * @param {string} msg - 明文
 * @param {string} publicKey - 公钥 (hex)
 * @param {object} options
 * @param {string} options.cipherEncoding - 'plain' | 'asn1'
 * @param {string} options.pointMarshalMode - 'uncompressed' | 'compressed' | 'hybrid'
 * @param {string} options.cipherSplicing - 'C1C3C2' | 'C1C2C3'
 * @returns {string} 加密后的密文 hex
 */
export function sm2EncryptFull(msg, publicKey, {
  cipherEncoding = 'asn1',
  pointMarshalMode = 'uncompressed',
  cipherSplicing = 'C1C3C2'
} = {}) {
  const mode = cipherSplicing === 'C1C2C3' ? 0 : 1
  const encrypted = sm2.doEncrypt(msg, publicKey, mode)
  if (!encrypted) throw new Error('加密失败')

  // 解析原始密文（sm-crypto 始终输出非压缩格式）
  const c1x = encrypted.substr(0, 64)
  const c1y = encrypted.substr(64, 64)
  let c3, c2

  if (cipherSplicing === 'C1C2C3') {
    // C1(128) + C2(变长) + C3(64)
    c2 = encrypted.substr(128, encrypted.length - 128 - 64)
    c3 = encrypted.substr(encrypted.length - 64)
  } else {
    // C1(128) + C3(64) + C2(变长)
    c3 = encrypted.substr(128, 64)
    c2 = encrypted.substr(128 + 64)
  }

  // 应用点序列化模式
  const c1Compressed = compressC1Point(c1x, c1y, pointMarshalMode)

  if (cipherEncoding === 'asn1') {
    // ASN.1 编码：始终使用 x, y 分开存储
    return sm2EncodeAsn1(c1x, c1y, c3, c2)
  } else {
    // 普通编码：按拼接顺序 + 点模式输出
    if (cipherSplicing === 'C1C2C3') {
      return c1Compressed + c2 + c3
    } else {
      return c1Compressed + c3 + c2
    }
  }
}

/**
 * SM2 解密（完整封装）
 * @param {string} cipherText - 密文 (hex)
 * @param {string} privateKey - 私钥 (hex)
 * @param {object} options
 * @param {string} options.cipherEncoding - 'plain' | 'asn1'
 * @param {string} options.pointMarshalMode - 'uncompressed' | 'compressed' | 'hybrid'
 * @param {string} options.cipherSplicing - 'C1C3C2' | 'C1C2C3'
 * @returns {string} 解密后的明文
 */
export function sm2DecryptFull(cipherText, privateKey, {
  cipherEncoding = 'asn1',
  pointMarshalMode = 'uncompressed',
  cipherSplicing = 'C1C3C2'
} = {}) {
  let c1x, c1y, c3, c2

  if (cipherEncoding === 'asn1') {
    // ASN.1 解码
    const parsed = sm2DecodeAsn1(cipherText.trim())
    c1x = parsed.c1x
    c1y = parsed.c1y
    c3 = parsed.c3
    c2 = parsed.c2
  } else {
    // 普通编码：根据点模式和拼接顺序解析
    const c1Len = getC1Length(pointMarshalMode)

    // 先提取 C1 并解压
    const c1Raw = cipherText.substr(0, c1Len)
    const decompressed = decompressC1Point(c1Raw)
    c1x = decompressed.c1x
    c1y = decompressed.c1y

    const rest = cipherText.substr(c1Len)

    if (cipherSplicing === 'C1C2C3') {
      // C2(变长) + C3(64)
      c2 = rest.substr(0, rest.length - 64)
      c3 = rest.substr(rest.length - 64)
    } else {
      // C3(64) + C2(变长)
      c3 = rest.substr(0, 64)
      c2 = rest.substr(64)
    }
  }

  // 重组为 sm-crypto 可识别的格式：C1(128) + C3(64) + C2(变长)
  const rawCipher = c1x + c1y + c3 + c2
  const mode = cipherSplicing === 'C1C2C3' ? 0 : 1
  return sm2.doDecrypt(rawCipher, privateKey, 1) // 始终用 C1C3C2 解密（内部格式）
}

/**
 * 获取 C1 在不同点模式下的 hex 长度
 */
function getC1Length(pointMarshalMode) {
  switch (pointMarshalMode) {
    case 'compressed': return 66   // prefix(2) + x(64)
    case 'hybrid': return 130      // prefix(2) + x(64) + y(64)
    case 'uncompressed':
    default: return 128            // x(64) + y(64)
  }
}
