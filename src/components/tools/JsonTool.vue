<template><StructuredTool kind="json" :example="example" :templates="templates" /></template>
<script setup>
import StructuredTool from '../workspace/StructuredTool.vue'
import { example, templates } from '../../data/jsonTemplates.js'
</script>
