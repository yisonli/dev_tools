import { parseTree, printParseErrorCode, format, createScanner, SyntaxKind } from 'jsonc-parser'

export const MAX_TEXT_BYTES = 5 * 1024 * 1024
export const MAX_DEPTH = 128

export function checkSize(text, limit = MAX_TEXT_BYTES) {
  if (text.length > limit || new TextEncoder().encode(text).length > limit) {
    throw new Error(`内容超过 ${limit / 1024 / 1024} MB，请拆分后处理。`)
  }
}

export function parseJsonDocument(text) {
  checkSize(text)
  // Limit nesting before entering the parser's recursive descent.
  const scanner = createScanner(text, false)
  let depth = 0
  for (let token = scanner.scan(); token !== SyntaxKind.EOF; token = scanner.scan()) {
    if (token === SyntaxKind.OpenBraceToken || token === SyntaxKind.OpenBracketToken) {
      if (++depth > MAX_DEPTH) throw new Error(`嵌套超过 ${MAX_DEPTH} 层，请拆分后处理。`)
    }
    if (token === SyntaxKind.CloseBraceToken || token === SyntaxKind.CloseBracketToken) depth--
  }
  const errors = []
  const root = parseTree(text, errors, { allowTrailingComma: false, disallowComments: true, allowEmptyContent: false })
  if (errors.length || !root) {
    const error = errors[0] || { error: 4, offset: 0, length: 1 }
    const before = text.slice(0, error.offset).split('\n')
    const code = printParseErrorCode(error.error)
    const description = ({ InvalidSymbol: '存在无效符号', InvalidNumberFormat: '数字格式不正确', PropertyNameExpected: '属性名必须是双引号字符串', ValueExpected: '缺少有效的 JSON 值', ColonExpected: '缺少冒号', CommaExpected: '缺少逗号', CloseBraceExpected: '缺少右花括号', CloseBracketExpected: '缺少右方括号', EndOfFileExpected: 'JSON 值后存在多余内容', InvalidCommentToken: '标准 JSON 不允许注释', UnexpectedEndOfString: '字符串未结束', InvalidEscapeCharacter: '无效的转义字符' })[code] || code
    const failure = new Error(`第 ${before.length} 行，第 ${before.at(-1).length + 1} 列：${description}`)
    failure.offset = error.offset
    failure.length = Math.max(1, error.length)
    throw failure
  }
  const duplicates = []
  const stats = { type: root.type, depth: 1, keys: 0, items: root.type === 'array' ? root.children.length : 0 }
  const pending = [{ node: root, depth: 1 }]
  while (pending.length) {
    const { node, depth } = pending.pop()
    stats.depth = Math.max(stats.depth, depth)
    if (node.type === 'object') {
      const seen = new Set()
      for (const prop of node.children) {
        const key = prop.children[0].value
        if (seen.has(key)) duplicates.push(key)
        seen.add(key)
        stats.keys++
        pending.push({ node: prop.children[1], depth: depth + 1 })
      }
    } else if (node.type === 'array') {
      for (const child of node.children) pending.push({ node: child, depth: depth + 1 })
    }
  }
  return { text, root, duplicates, stats }
}

export function rawNode(doc, node = doc.root) {
  return doc.text.slice(node.offset, node.offset + node.length)
}

export function formatJson(text, compact = false) {
  parseJsonDocument(text)
  if (!compact) {
    // Apply non-overlapping edits in one pass. Repeatedly slicing the entire
    // document for each whitespace edit becomes quadratic on large inputs.
    const edits = format(text, undefined, { tabSize: 2, insertSpaces: true, eol: '\n' })
    const parts = []
    let cursor = 0
    for (const edit of edits) {
      parts.push(text.slice(cursor, edit.offset), edit.content)
      cursor = edit.offset + edit.length
    }
    parts.push(text.slice(cursor))
    return parts.join('').trim()
  }
  const scanner = createScanner(text, false)
  const chunks = []
  for (let token = scanner.scan(); token !== SyntaxKind.EOF; token = scanner.scan()) {
    if (token !== SyntaxKind.Trivia && token !== SyntaxKind.LineBreakTrivia) {
      chunks.push(text.slice(scanner.getTokenOffset(), scanner.getTokenOffset() + scanner.getTokenLength()))
    }
  }
  return chunks.join('')
}

export function requireUniqueKeys(doc) {
  if (doc.duplicates.length) throw new Error(`存在重复键 ${JSON.stringify(doc.duplicates[0])}，请先消除歧义；格式化和文本比较仍可使用。`)
}

// A deliberately bounded path grammar, without eval or prototype traversal.
export function pathParts(path) {
  let rest = path.trim().replace(/^\$\.?/, '')
  const parts = []
  while (rest) {
    const match = rest.match(/^(?:\.([^.[\]]+)|([^.[\]]+)|\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\])/)
    if (!match) throw new Error('路径支持 $.user.name、users[0] 和 $["含点的键"]。')
    parts.push(match[4] ? JSON.parse(match[4]) : match[1] ?? match[2] ?? match[3])
    rest = rest.slice(match[0].length)
  }
  return parts
}

export function queryJson(text, path) {
  const doc = parseJsonDocument(text)
  requireUniqueKeys(doc)
  let node = doc.root
  for (const part of pathParts(path)) {
    node = node.type === 'array' && /^(0|[1-9]\d*)$/.test(part)
      ? node.children[Number(part)]
      : node.type === 'object' ? node.children.find(p => p.children[0].value === part)?.children[1] : undefined
    if (!node) throw new Error(`路径不存在：${path}`)
  }
  return formatJson(rawNode(doc, node))
}

function scalarText(doc, node) {
  return node.type === 'string' ? node.value : rawNode(doc, node)
}

export function jsonToCsv(text) {
  const doc = parseJsonDocument(text)
  requireUniqueKeys(doc)
  if (doc.root.type !== 'array' || !doc.root.children.length || doc.root.children.some(n => n.type !== 'object')) {
    throw new Error('CSV 转换需要非空的对象数组。')
  }
  const headers = [...new Set(doc.root.children.flatMap(n => n.children.map(p => p.children[0].value)))]
  const quote = value => `"${String(value).replace(/"/g, '""')}"`
  return [headers.map(quote).join(','), ...doc.root.children.map(n => headers.map(key => {
    const value = n.children.find(p => p.children[0].value === key)?.children[1]
    return quote(value ? scalarText(doc, value) : '')
  }).join(','))].join('\r\n')
}

export function jsonToXml(text) {
  const doc = parseJsonDocument(text)
  requireUniqueKeys(doc)
  const escape = value => String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c])
  const render = (node, key, depth) => {
    if (!/^[\p{L}_][\p{L}\p{N}_.\-\u00B7\u0300-\u036F\u203F-\u2040]*$/u.test(key)) throw new Error(`XML 元素名不支持键 ${JSON.stringify(key)}，请先重命名。`)
    const indent = '  '.repeat(depth)
    if (node.type !== 'object' && node.type !== 'array') return `${indent}<${key}>${escape(scalarText(doc, node))}</${key}>`
    const lines = node.type === 'array'
      ? node.children.map(n => render(n, 'item', depth + 1))
      : node.children.map(p => render(p.children[1], p.children[0].value, depth + 1))
    return `${indent}<${key}>\n${lines.join('\n')}\n${indent}</${key}>`
  }
  return render(doc.root, 'root', 0)
}

export function jsonToYaml(text) {
  const doc = parseJsonDocument(text)
  requireUniqueKeys(doc)
  const render = (node, level = 0) => {
    const indent = '  '.repeat(level)
    if (!['array', 'object'].includes(node.type) || !node.children.length) return rawNode(doc, node)
    const line = (prefix, child) => {
      const nested = ['array', 'object'].includes(child.type) && child.children.length
      return `${indent}${prefix}${nested ? '\n' + render(child, level + 1) : ' ' + render(child, level + 1)}`
    }
    return node.type === 'array' ? node.children.map(n => line('-', n)).join('\n')
      : node.children.map(p => line(`${JSON.stringify(p.children[0].value)}:`, p.children[1])).join('\n')
  }
  return render(doc.root) + '\n'
}

// Exact decimal normalization for semantic comparison (no floating point conversion).
function canonicalNumber(raw) {
  const [, sign, integer, fraction = '', exponent = '0'] = raw.match(/^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/)
  let digits = (integer + fraction).replace(/^0+/, '')
  if (!digits) return '0'
  const trailing = digits.match(/0*$/)[0].length
  digits = digits.slice(0, digits.length - trailing)
  return `${sign}${digits}e${BigInt(exponent) - BigInt(fraction.length) + BigInt(trailing)}`
}

export function canonicalJson(text, sortKeys = true) {
  const doc = parseJsonDocument(text)
  requireUniqueKeys(doc)
  const render = (node, depth = 0) => {
    if (node.type === 'number') return canonicalNumber(rawNode(doc, node))
    if (node.type === 'string') return JSON.stringify(node.value)
    if (node.type !== 'array' && node.type !== 'object') return rawNode(doc, node)
    let children = [...node.children]
    if (node.type === 'object' && sortKeys) children.sort((a, b) => a.children[0].value < b.children[0].value ? -1 : a.children[0].value > b.children[0].value ? 1 : 0)
    const entries = children.map(n => node.type === 'array' ? render(n, depth + 1) : `${JSON.stringify(n.children[0].value)}: ${render(n.children[1], depth + 1)}`)
    const [open, close] = node.type === 'array' ? ['[', ']'] : ['{', '}']
    return entries.length ? `${open}\n${entries.map(s => '  '.repeat(depth + 1) + s).join(',\n')}\n${'  '.repeat(depth)}${close}` : open + close
  }
  return render(doc.root)
}
