import { ref } from 'vue'

export const notification = ref(null)
let timer
export function notify(message, type = 'success') {
  clearTimeout(timer)
  notification.value = { message, type }
  timer = setTimeout(() => { notification.value = null }, 3500)
}

export async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
    else {
      const previous = document.activeElement
      const field = document.createElement('textarea')
      field.value = value; field.style.cssText = 'position:fixed;left:-9999px;top:0;'
      document.body.append(field); field.select()
      const copied = document.execCommand('copy')
      field.remove(); previous?.focus()
      if (!copied) throw new Error('copy')
    }
    notify('已复制到剪贴板')
    return true
  } catch { notify('复制失败，请选中内容后手动复制。', 'error'); return false }
}

export function downloadText(text, extension = 'txt') {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = `result.${extension}`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
