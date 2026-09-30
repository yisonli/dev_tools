<template><div v-if="notification" class="app-toast" :class="notification.type" role="status" aria-live="polite">{{ notification.message }}</div></template>
<script setup>
import { notification } from '../utils/clipboard.js'
</script>
