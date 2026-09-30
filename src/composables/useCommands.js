import { shallowRef, onMounted, onBeforeUnmount } from 'vue'

export const activeCommands = shallowRef([])
export const commandPaletteOpen = shallowRef(false)

export function useCommands(commands) {
  onMounted(() => { activeCommands.value = commands })
  onBeforeUnmount(() => { if (activeCommands.value === commands) activeCommands.value = [] })
}
