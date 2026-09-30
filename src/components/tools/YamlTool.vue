<template><StructuredTool kind="yaml" :example="example" :templates="templates" /></template>
<script setup>
import StructuredTool from '../workspace/StructuredTool.vue'
import { example, templates } from '../../data/yamlTemplates.js'
</script>
