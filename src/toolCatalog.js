import {
  Barcode, Braces, CalendarClock, Code2, FileJson, FileKey2, Hash,
  KeyRound, Link2, LockKeyhole, QrCode, Regex, ScanLine, ShieldCheck,
  TextCursorInput, TicketCheck, Type, Wrench
} from '@lucide/vue'

export const tools = [
  { name: 'Base64', path: '/base64', category: '编码', description: '文本 Base64 编码和解码', icon: Code2 },
  { name: 'URL 编码', path: '/url', category: '编码', description: 'URL 编码、解码和组成解析', icon: Link2 },
  { name: 'Unicode', path: '/unicode', category: '编码', description: 'Unicode、UTF-8 与实体转换', icon: Type },
  { name: 'AES', path: '/aes', category: '加密', description: 'AES 对称加密与解密', icon: LockKeyhole },
  { name: 'DES / 3DES', path: '/des', category: '加密', description: '兼容旧系统的 DES 工具', icon: KeyRound },
  { name: 'RSA', path: '/rsa', category: '加密', description: '密钥生成、加密、签名和验证', icon: FileKey2 },
  { name: 'SM2', path: '/sm2', category: '加密', description: '国密 SM2 加解密和签名', icon: ShieldCheck },
  { name: '哈希摘要', path: '/hash', category: '加密', description: 'MD5、SHA-1、SHA-256 和 SHA-512', icon: Hash },
  { name: 'JWT 解析', path: '/jwt', category: '格式与接口', description: '查看 Token 头、载荷和过期时间', icon: TicketCheck },
  { name: 'JSON', path: '/json', category: '格式与接口', description: '校验、格式化、压缩和路径查询', icon: FileJson },
  { name: 'YAML', path: '/yaml', category: '格式与接口', description: 'YAML 校验与 JSON 互转', icon: Braces },
  { name: '正则表达式', path: '/regex', category: '格式与接口', description: '实时匹配、替换和分割测试', icon: Regex },
  { name: '文本处理', path: '/text', category: '格式与接口', description: '去重、排序、清理空行和大小写', icon: TextCursorInput },
  { name: '二维码', path: '/qrcode', category: '图码', description: '二维码生成与图片识别', icon: QrCode },
  { name: '条形码', path: '/barcode', category: '图码', description: '条形码生成与图片识别', icon: Barcode },
  { name: '时间戳', path: '/timestamp', category: '常用', description: '时间戳、时区和批量转换', icon: CalendarClock },
  { name: '密码生成器', path: '/password', category: '常用', description: '生成可配置的随机密码', icon: KeyRound },
  { name: 'UUID', path: '/uuid', category: '常用', description: '安全生成 UUID v4', icon: ScanLine },
]

export const categories = ['全部', ...new Set(tools.map((tool) => tool.category))]
