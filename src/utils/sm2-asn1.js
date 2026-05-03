/**
 * SM2 密文的 ASN.1 DER 编解码
 * 遵循 GM/T 0003.4-2012 国密标准
 *
 * SM2Cipher ::= SEQUENCE {
 *     XCoordinate INTEGER,      -- C1.x (32 bytes)
 *     YCoordinate INTEGER,      -- C1.y (32 bytes)
 *     HASH OCTET STRING,        -- C3 (32 bytes SM3 hash)
 *     CipherText OCTET STRING   -- C2 (variable length)
 * }
 */

/**
 * 将 hex 字符串转为字节数组
 */
function hexToBytes(hex) {
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return bytes
}

/**
 * 字节数组转 hex
 */
function bytesToHex(bytes) {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 编码一个 INTEGER 的 DER TLV
 * @param {string} hex - 十六进制表示的整数（无前导0x）
 * @returns {string} DER 编码的 hex 字符串
 */
function derEncodeInteger(hex) {
  // 确保偶数长度
  if (hex.length % 2 !== 0) hex = '0' + hex

  // 如果最高位 >= 8，需要补 00 字节（DER 正数要求）
  const firstByte = parseInt(hex.substr(0, 2), 16)
  if (firstByte >= 0x80) hex = '00' + hex

  const lenBytes = hex.length / 2
  const lenHex = derEncodeLength(lenBytes)
  return '02' + lenHex + hex
}

/**
 * 编码一个 OCTET STRING 的 DER TLV
 * @param {string} hex - 十六进制数据
 * @returns {string} DER 编码的 hex 字符串
 */
function derEncodeOctetString(hex) {
  // 确保偶数长度
  if (hex.length % 2 !== 0) hex = '0' + hex

  const lenBytes = hex.length / 2
  const lenHex = derEncodeLength(lenBytes)
  return '04' + lenHex + hex
}

/**
 * DER 长度编码
 * @param {number} len - 字节长度
 * @returns {string} DER 编码的长度 hex
 */
function derEncodeLength(len) {
  if (len < 0x80) {
    // 短格式：单字节
    return len.toString(16).padStart(2, '0')
  } else {
    // 长格式：第一个字节 = 0x80 + 长度字段的字节数
    const lenHex = len.toString(16)
    const numLenBytes = Math.ceil(lenHex.length / 2)
    return (0x80 + numLenBytes).toString(16).padStart(2, '0') +
      lenHex.padStart(numLenBytes * 2, '0')
  }
}

/**
 * 解析 DER 长度
 * @param {string} hex - hex 字符串（从长度字段开始）
 * @param {number} offset - 起始偏移（hex 字符）
 * @returns {{ length: number, nextOffset: number }}
 */
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

/**
 * 将 SM2 加密的各部分编码为 ASN.1 DER 格式
 *
 * @param {string} c1x - C1 点的 x 坐标（64字符 hex）
 * @param {string} c1y - C1 点的 y 坐标（64字符 hex）
 * @param {string} c3  - SM3 哈希值（64字符 hex）
 * @param {string} c2  - 加密后的密文（hex）
 * @returns {string} ASN.1 DER 编码的 hex 字符串
 */
export function sm2EncodeAsn1(c1x, c1y, c3, c2) {
  const derX = derEncodeInteger(c1x)
  const derY = derEncodeInteger(c1y)
  const derHash = derEncodeOctetString(c3)
  const derCipher = derEncodeOctetString(c2)

  const inner = derX + derY + derHash + derCipher
  const innerLen = inner.length / 2
  const lenHex = derEncodeLength(innerLen)

  return '30' + lenHex + inner
}

/**
 * 从 ASN.1 DER 格式解析 SM2 密文各部分
 *
 * @param {string} asn1Hex - ASN.1 DER 编码的 hex 字符串
 * @returns {{ c1x: string, c1y: string, c3: string, c2: string }}
 * @throws {Error} 解析失败时抛出异常
 */
export function sm2DecodeAsn1(asn1Hex) {
  let pos = 0

  // 1. 解析 SEQUENCE tag
  if (asn1Hex.substr(pos, 2) !== '30') {
    throw new Error('ASN.1 解析错误：期望 SEQUENCE (0x30)，实际为 0x' + asn1Hex.substr(pos, 2))
  }
  pos += 2

  // 2. 解析 SEQUENCE 长度
  const seqLen = derDecodeLength(asn1Hex, pos)
  pos = seqLen.nextOffset

  // 3. 解析 C1.x (INTEGER)
  if (asn1Hex.substr(pos, 2) !== '02') {
    throw new Error('ASN.1 解析错误：期望 INTEGER (0x02) for C1.x')
  }
  pos += 2
  const xLen = derDecodeLength(asn1Hex, pos)
  pos = xLen.nextOffset
  let c1x = asn1Hex.substr(pos, xLen.length * 2)
  pos += xLen.length * 2
  // 去掉可能的前导 00
  c1x = c1x.replace(/^00/, '')

  // 4. 解析 C1.y (INTEGER)
  if (asn1Hex.substr(pos, 2) !== '02') {
    throw new Error('ASN.1 解析错误：期望 INTEGER (0x02) for C1.y')
  }
  pos += 2
  const yLen = derDecodeLength(asn1Hex, pos)
  pos = yLen.nextOffset
  let c1y = asn1Hex.substr(pos, yLen.length * 2)
  pos += yLen.length * 2
  c1y = c1y.replace(/^00/, '')

  // 5. 解析 C3 (OCTET STRING)
  if (asn1Hex.substr(pos, 2) !== '04') {
    throw new Error('ASN.1 解析错误：期望 OCTET STRING (0x04) for C3')
  }
  pos += 2
  const hashLen = derDecodeLength(asn1Hex, pos)
  pos = hashLen.nextOffset
  const c3 = asn1Hex.substr(pos, hashLen.length * 2)
  pos += hashLen.length * 2

  // 6. 解析 C2 (OCTET STRING)
  if (asn1Hex.substr(pos, 2) !== '04') {
    throw new Error('ASN.1 解析错误：期望 OCTET STRING (0x04) for C2')
  }
  pos += 2
  const cipherLen = derDecodeLength(asn1Hex, pos)
  pos = cipherLen.nextOffset
  const c2 = asn1Hex.substr(pos, cipherLen.length * 2)

  return { c1x, c1y, c3, c2 }
}
