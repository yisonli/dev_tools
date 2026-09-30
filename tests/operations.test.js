import test from 'node:test'
import assert from 'node:assert/strict'
import { formatJson, parseJsonDocument, queryJson, jsonToYaml, jsonToCsv, jsonToXml, canonicalJson } from '../src/utils/json.js'
import { formatYaml, yamlToJson, validateYaml } from '../src/utils/yaml.js'
import { processData } from '../src/utils/operations.js'

const exact = '{"id":9223372036854775807,"decimal":1.123456789012345678901,"exponent":1e999,"negativeZero":-0,"escaped":"\\u4f60\\n<b>你好 & 🌍</b>"}'
test('formatting and compression preserve numeric and string tokens', () => {
  assert.equal(formatJson(formatJson(exact), true), exact)
  for (const raw of ['null', 'false', '0', '-0', '"🌍"', '[]', '{}', '1e999']) assert.equal(formatJson(raw, true), raw)
})
test('strict JSON rejects comments, trailing commas, malformed paths and excessive nesting', () => {
  for (const raw of ['{"x":1,}', '{/*x*/"x":1}', '', '{x:1}', '[01]', '[NaN]']) assert.throws(() => formatJson(raw))
  assert.throws(() => formatJson('['.repeat(130) + '0' + ']'.repeat(130)), /嵌套/)
  assert.throws(() => queryJson('{}', '$[?(@.x)]'), /路径/)
})
test('duplicates survive formatting and are rejected in semantic operations', () => {
  const input = '{"a":1,"a":2}'
  assert.equal(formatJson(formatJson(input), true), input)
  assert.deepEqual(parseJsonDocument(input).duplicates, ['a'])
  for (const fn of [canonicalJson, jsonToYaml, jsonToCsv, jsonToXml]) assert.throws(() => fn(input), /重复键/)
  assert.throws(() => queryJson(input, '$.a'), /重复键/)
})
test('queries preserve exact values, support escaped property names and do not traverse prototypes', () => {
  assert.equal(queryJson(exact, '$.id'), '9223372036854775807')
  assert.equal(queryJson('{"a.b":[null,false,{"x":1.234567890123456789}]}', '$["a.b"][2].x'), '1.234567890123456789')
  assert.equal(queryJson('{"__proto__":42}', '$.__proto__'), '42')
  assert.throws(() => queryJson('{}', '$.constructor'), /不存在/)
})
test('CSV escapes quotes and multiline cells and includes keys from later rows', () => {
  const csv = jsonToCsv('[{"id":9223372036854775807,"text":"a,\\"b\\"\\nc"},{"new":true}]')
  assert.equal(csv, '"id","text","new"\r\n"9223372036854775807","a,""b""\nc",""\r\n"","","true"')
})
test('XML escapes data and refuses invalid element names', () => {
  assert.match(jsonToXml('{"value":"<b>&\\""}'), /&lt;b&gt;&amp;&quot;/)
  assert.match(jsonToXml('{"名称":"工具箱"}'), /<名称>工具箱<\/名称>/)
  assert.throws(() => jsonToXml('{"bad key":1}'), /元素名/)
})
test('JSON to YAML to JSON retains exact numeric values and string meanings', () => {
  const yaml = jsonToYaml(exact)
  const back = yamlToJson(formatYaml(yaml))
  assert.equal(canonicalJson(back), canonicalJson(exact))
  assert.match(back, /9223372036854775807/)
  assert.match(back, /1\.123456789012345678901/)
  assert.match(back, /1e999/)
  assert.match(back, /-0/)
})
test('YAML formatting keeps comments, numeric spellings and multiple documents', () => {
  const input = '# config\nid: 9223372036854775807\nf: 1.1234567890123456789\nx: -0\n---\nname: demo\n'
  const result = formatYaml(input)
  assert.match(result, /# config/)
  assert.match(result, /1\.1234567890123456789/)
  assert.match(result, /x: -0/)
  assert.equal(validateYaml(result).documents, 2)
  assert.throws(() => yamlToJson(input), /多文档/)
})
test('YAML conversion handles aliases and merge precedence while refusing cycles and invalid types', () => {
  assert.equal(queryJson(yamlToJson('a: &a {x: 1}\nb: *a'), '$.b.x'), '1')
  assert.throws(() => yamlToJson('a: &a {b: *a}'), /循环/)
  assert.equal(queryJson(yamlToJson('a: &a {b: 1}\nc: {<<: *a}'), '$.c.b'), '1')
  assert.equal(queryJson(yamlToJson('a: &a {b: 1}\nc: {b: 2, <<: *a}'), '$.c.b'), '2')
  assert.throws(() => yamlToJson('a: &a {<<: *a}'), /循环/)
  assert.throws(() => yamlToJson('n: .nan'), /NaN/)
  assert.throws(() => yamlToJson('x: 1\nx: 2'), /unique|重复/)
})
test('Base64 round-trips Unicode and rejects malformed input', () => {
  const input = '你好 🌍\n\t<b>text</b>'
  const encoded = processData({ kind: 'base64', action: 'encode', input }).text
  assert.equal(processData({ kind: 'base64', action: 'decode', input: encoded }).text, input)
  assert.equal(processData({ kind: 'base64', action: 'decode', input: ' Y Q==\n' }).text, 'a')
  assert.throws(() => processData({ kind: 'base64', action: 'decode', input: '!@#' }))
})
test('semantic diff compares exact numbers, preserves arrays and string whitespace', () => {
  assert.equal(canonicalJson('{"b":1.00,"a":1e3}'), canonicalJson('{"a":1000,"b":1}'))
  assert.notEqual(canonicalJson('{"id":9223372036854775807}'), canonicalJson('{"id":9223372036854775808}'))
  assert.notEqual(canonicalJson('[1,2]'), canonicalJson('[2,1]'))
  assert.notEqual(canonicalJson('" a "'), canonicalJson('"a"'))
  assert.notEqual(canonicalJson('{"b":1,"a":2}', false), canonicalJson('{"a":2,"b":1}', false))
})
test('Diff supports empty sides, changes and explicit whitespace rules', () => {
  const compare = (left, right, opts = {}) => processData({ kind: 'diff', input: left, options: { right, ...opts } }).changes
  assert.ok(compare('', '').every(c => !c.added && !c.removed))
  assert.ok(compare('', 'added').some(c => c.added))
  assert.ok(compare('a\nb', 'a\nc').some(c => c.removed))
  assert.ok(compare(' a \n', 'a\n', { ignoreWhitespace: true }).every(c => !c.added && !c.removed))
  assert.throws(() => compare('x'.repeat(1024 * 1024 + 1), ''), /超过/)
})

test('text operations preserve existing line handling and compose without losing original data', () => {
  const run = (input, action) => processData({ kind: 'text', input, action }).text
  const original = '  banana  \r\napple\r\n \r\nbanana\r\napple'
  const trimmed = run(original, 'trim')
  assert.equal(trimmed, 'banana\napple\n\nbanana\napple')
  assert.equal(run(run(run(trimmed, 'empty'), 'unique'), 'sort'), 'apple\nbanana')
  assert.equal(run(' a\na\n a', 'unique'), ' a\na')
  assert.equal(run('你好 a\r\nB', 'upper'), '你好 A\r\nB')
  assert.equal(run('你好 A', 'lower'), '你好 a')
  assert.equal(run(' \n\t', 'empty'), '')
  assert.throws(() => run('text', 'unsupported'), /有效的文本操作/)
})
