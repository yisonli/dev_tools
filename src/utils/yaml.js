import { parseAllDocuments, isScalar, isMap, isSeq, isAlias } from 'yaml'
import { checkSize, MAX_DEPTH, formatJson } from './json.js'

function documents(text) {
  checkSize(text)
  const docs = parseAllDocuments(text, {
    intAsBigInt: true,
    keepSourceTokens: true,
    merge: true,
    customTags: tags => tags.map(tag => /:(int|float)$/.test(tag.tag) ? {
      ...tag,
      stringify: (item, ...args) => item.source ?? tag.stringify(item, ...args),
    } : tag),
  })
  for (const doc of docs) {
    if (doc.errors.length) {
      const error = new Error(doc.errors[0].message)
      error.offset = doc.errors[0].pos?.[0] ?? 0
      throw error
    }
    if (doc.warnings.some(w => w.code === 'TAG_RESOLVE_FAILED')) throw new Error('包含不支持的 YAML 标签，请先转换为标准数据类型。')
  }
  if (!docs.length) throw new Error('请输入 YAML 内容。')
  return docs
}

function documentJson(doc) {
  let budget = 100000
  const active = new Set()
  function entries(node, depth = 0, ancestors = new Set()) {
    if (--budget < 0 || depth > MAX_DEPTH) throw new Error('YAML 合并展开过多，请拆分后处理。')
    if (isAlias(node)) node = node.resolve(doc)
    if (ancestors.has(node)) throw new Error('循环引用无法转换为 JSON。')
    if (!isMap(node)) throw new Error('YAML 合并键必须引用对象或对象列表。')
    const trail = new Set(ancestors).add(node), merged = new Map(), explicit = new Map()
    for (const pair of node.items) {
      if (!isScalar(pair.key)) throw new Error('复杂键不能直接转换为 JSON，请先改为字符串键。')
      if (typeof pair.key.value === 'symbol') {
        const sources = isSeq(pair.value) ? pair.value.items : [pair.value]
        for (const source of sources) for (const [key, value] of entries(source, depth + 1, trail)) if (!merged.has(key)) merged.set(key, value)
      } else {
        const key = typeof pair.key.value === 'number' || typeof pair.key.value === 'bigint' ? pair.key.source : String(pair.key.value)
        if (explicit.has(key)) throw new Error(`转换后存在重复键：${key}`)
        explicit.set(key, pair.value)
      }
    }
    for (const [key, value] of explicit) merged.set(key, value)
    return merged
  }
  const render = (node, depth = 0) => {
    if (depth > MAX_DEPTH || --budget < 0) throw new Error('YAML 嵌套或别名展开过多，请拆分后处理。')
    if (node == null) return 'null'
    if (active.has(node)) throw new Error('循环引用无法转换为 JSON。')
    active.add(node)
    try {
      if (isAlias(node)) return render(node.resolve(doc), depth + 1)
      if (isSeq(node)) return `[${node.items.map(n => render(n, depth + 1)).join(',')}]`
      if (isMap(node)) {
        return `{${[...entries(node)].map(([key, value]) => `${JSON.stringify(key)}:${render(value, depth + 1)}`).join(',')}}`
      }
      if (!isScalar(node)) throw new Error('不支持的 YAML 数据类型。')
      if (typeof node.value === 'bigint' || typeof node.value === 'number') {
        let raw = node.source.replace(/_/g, '')
        if (/^[+-]?0[xo]/i.test(raw)) return String(node.value)
        raw = raw.replace(/^\+/, '').replace(/^(-?)\./, '$10.').replace(/\.(?=[eE]|$)/, '.0')
        if (!/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(raw)) {
          if (/^-?\d+$/.test(raw)) return String(node.value)
          throw new Error('JSON 不支持 NaN 或 Infinity。')
        }
        return raw
      }
      return JSON.stringify(node.value)
    } finally { active.delete(node) }
  }
  return render(doc.contents)
}

export function formatYaml(text) {
  return documents(text).map(doc => doc.toString({ indent: 2, lineWidth: 100 })).join('')
}

export function yamlToJson(text) {
  const docs = documents(text)
  if (docs.length !== 1) throw new Error('多文档 YAML 可以格式化；转换或查询时请一次输入一个文档。')
  return formatJson(documentJson(docs[0]))
}

export function validateYaml(text) {
  const docs = documents(text)
  return { documents: docs.length }
}
