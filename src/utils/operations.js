import { diffLines } from 'diff'
import { checkSize, formatJson, parseJsonDocument, canonicalJson, queryJson, jsonToCsv, jsonToXml, jsonToYaml } from './json.js'
import { formatYaml, yamlToJson, validateYaml } from './yaml.js'

export function processData({ kind, action = 'format', input, options = {} }) {
  checkSize(input)
  if (kind === 'text') {
    const lines = input.split(/\r?\n/)
    const transforms = {
      trim: () => lines.map(line => line.trim()),
      empty: () => lines.filter(line => line.trim()),
      unique: () => [...new Set(lines)],
      sort: () => [...lines].sort((a, b) => a.localeCompare(b)),
      upper: () => [input.toUpperCase()],
      lower: () => [input.toLowerCase()],
    }
    if (!transforms[action]) throw new Error('请选择有效的文本操作。')
    return { text: transforms[action]().join('\n'), language: 'text', extension: 'txt' }
  }
  if (kind === 'base64') {
    try {
      const text = action === 'decode' ? decodeURIComponent(escape(atob(input))) : btoa(unescape(encodeURIComponent(input)))
      return { text, language: 'text', extension: 'txt' }
    } catch { throw new Error(action === 'decode' ? '解码失败：请输入有效的 Base64 编码 UTF-8 文本。' : '编码失败：输入含有不完整的 Unicode 字符。') }
  }
  if (kind === 'diff') {
    checkSize(input, 1024 * 1024)
    checkSize(options.right, 1024 * 1024)
    const left = options.mode === 'json' ? canonicalJson(input, options.sortKeys) : input
    const right = options.mode === 'json' ? canonicalJson(options.right, options.sortKeys) : options.right
    const changes = diffLines(left, right, { ignoreWhitespace: options.mode !== 'json' && options.ignoreWhitespace, timeout: 1500, maxEditLength: 20000 })
    if (!changes) throw new Error('差异过多或比较超时，请缩小比较范围。')
    if (changes.length > 2000) throw new Error('差异块超过 2000 个，请拆分后比较。')
    return { changes, text: '', language: 'text' }
  }
  if (kind === 'yaml') {
    if (action === 'check') { validateYaml(input); return { text: '', language: 'yaml' } }
    if (action === 'from-json') return { text: jsonToYaml(input), language: 'yaml', extension: 'yaml' }
    if (action === 'format' || action === 'validate') {
      const info = validateYaml(input)
      let stats = null
      if (info.documents === 1) try { stats = parseJsonDocument(yamlToJson(input)).stats } catch { /* Valid YAML may not have a JSON representation. */ }
      if (action === 'format') return { text: formatYaml(input), language: 'yaml', extension: 'yaml', stats }
      return { text: `YAML 格式正确，共 ${info.documents} 个文档。${stats ? `\n类型：${stats.type}\n层级深度：${stats.depth}\n键数量：${stats.keys}\n顶层数组项：${stats.items}` : ''}`, language: 'text', extension: 'txt', stats }
    }
    return { text: action === 'query' ? queryJson(yamlToJson(input), options.path) : yamlToJson(input), language: 'json', extension: 'json' }
  }
  if (action === 'check') { parseJsonDocument(input); return { text: '', language: 'json' } }
  if (action === 'escape') return { text: JSON.stringify(input), language: 'json', extension: 'json' }
  if (action === 'unescape') {
    const doc = parseJsonDocument(input)
    if (doc.root.type !== 'string') throw new Error('反转义需要 JSON 字符串，例如 "{\\"id\\":1}"。')
    return { text: doc.root.value, language: 'text', extension: 'txt' }
  }
  if (action === 'csv') return { text: jsonToCsv(input), language: 'text', extension: 'csv' }
  if (action === 'xml') return { text: jsonToXml(input), language: 'text', extension: 'xml' }
  if (action === 'yaml') return { text: jsonToYaml(input), language: 'yaml', extension: 'yaml' }
  if (action === 'query') return { text: queryJson(input, options.path), language: 'json', extension: 'json' }
  const doc = parseJsonDocument(input)
  return { text: formatJson(input, action === 'compact'), language: 'json', extension: 'json', stats: doc.stats, warning: doc.duplicates.length ? '存在重复键，已原样保留；查询和语义转换需要先消除歧义。' : '' }
}
