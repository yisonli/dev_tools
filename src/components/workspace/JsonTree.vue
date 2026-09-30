<template>
  <div class="json-tree-node">
    <div class="tree-row">
      <button v-if="container" class="tree-toggle" :aria-expanded="open" :aria-label="`${open ? '折叠' : '展开'} ${name}`" @click="open = !open">{{ open ? '▾' : '▸' }}</button><span v-else class="tree-spacer" />
      <span class="tree-key">{{ name }}</span><span class="tree-value">{{ summary }}</span>
      <button class="tree-copy" @click="copyText(rawNode(doc, node))" :aria-label="`复制 ${name} 的值`">值</button><button class="tree-copy" @click="copyText(path)" :aria-label="`复制 ${name} 的路径`">路径</button>
    </div>
    <div v-if="open && container" class="tree-children">
      <JsonTree v-for="(child, index) in node.children.slice(0, limit)" :key="index" :doc="doc" :node="node.type === 'object' ? child.children[1] : child" :name="node.type === 'object' ? child.children[0].value : String(index)" :path="node.type === 'object' ? `${path}[${JSON.stringify(child.children[0].value)}]` : `${path}[${index}]`" :depth="depth + 1" />
      <button v-if="node.children.length > limit" class="icon-button" @click="limit += 100">再显示 100 项（剩余 {{ node.children.length - limit }}）</button>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { rawNode } from '../../utils/json.js'
import { copyText } from '../../utils/clipboard.js'
const props = defineProps({ doc: Object, node: Object, name: { type: String, default: '$' }, path: { type: String, default: '$' }, depth: { type: Number, default: 0 } })
const open = ref(props.depth === 0), limit = ref(100)
const container = computed(() => ['array', 'object'].includes(props.node.type))
const summary = computed(() => container.value ? `${props.node.type === 'array' ? '数组' : '对象'} · ${props.node.children.length} 项` : rawNode(props.doc, props.node).slice(0, 160))
</script>
