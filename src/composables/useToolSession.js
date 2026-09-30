import { reactive, watch, onBeforeUnmount } from 'vue'

const sessions = new Map()
const jobs = new Map()

export function getSession(key) {
  if (!sessions.has(key)) sessions.set(key, reactive({
    input: '', output: '', language: 'text', extension: 'txt', status: 'idle', error: '', offset: null,
    warning: '', stats: null, changes: [], revision: 0, resultRevision: -1, elapsed: 0,
    options: { auto: false, path: '', right: '', mode: 'text', sortKeys: true, ignoreWhitespace: false },
    undo: null,
  }))
  return sessions.get(key)
}

export function stopJob(session, status = 'cancelled') {
  const job = jobs.get(session)
  if (job) {
    job.worker.terminate()
    clearTimeout(job.timer)
    jobs.delete(session)
    job.resolve(false)
    session.status = status
  }
}

export function invalidate(session) {
  stopJob(session, 'modified')
  session.revision++
  session.status = session.input || session.options.right || session.output ? 'modified' : 'idle'
  session.error = ''; session.offset = null; session.warning = ''
}

export function replaceInput(session, input, field = 'input') {
  session.undo = { input: session.input, right: session.options.right }
  if (field === 'right') session.options.right = input
  else session.input = input
  invalidate(session)
}

export function swapInputs(session) {
  session.undo = { input: session.input, right: session.options.right }
  const left = session.input
  session.input = session.options.right
  session.options.right = left
  invalidate(session)
}

export function restoreInput(session) {
  if (!session.undo) return
  const previous = session.undo
  session.undo = { input: session.input, right: session.options.right }
  session.input = previous.input
  session.options.right = previous.right
  invalidate(session)
}

export function isFresh(session) {
  return session.status === 'success' && session.revision === session.resultRevision
}

export function useToolSession(key) {
  const session = getSession(key)
  watch(() => [session.input, session.options.path, session.options.right, session.options.mode, session.options.sortKeys, session.options.ignoreWhitespace, session.options.action], () => invalidate(session), { flush: 'sync' })
  onBeforeUnmount(() => stopJob(session))
  return session
}

export function runOperation(session, kind, action) {
  stopJob(session)
  const revision = session.revision
  const start = performance.now()
  session.status = 'running'; session.error = ''; session.offset = null; session.warning = ''
  return new Promise(resolve => {
    let worker
    const finish = (result, error, offset) => {
      const job = jobs.get(session)
      if (job?.worker !== worker) return
      clearTimeout(job.timer); worker.terminate(); jobs.delete(session)
      if (session.revision !== revision) { resolve(false); return }
      session.elapsed = Math.round(performance.now() - start)
      if (error) { session.status = 'error'; session.error = error; session.offset = offset ?? null }
      else {
        session.output = result.text; session.language = result.language; session.extension = result.extension || 'txt'
        session.warning = result.warning || ''; session.stats = result.stats || null; session.changes = result.changes || []
        session.resultRevision = revision; session.status = 'success'
      }
      resolve(!error)
    }
    try {
      worker = new Worker(new URL('../workers/processor.js', import.meta.url), { type: 'module' })
      const timer = setTimeout(() => finish(null, '处理超时，请缩小内容后重试。'), 8000)
      jobs.set(session, { worker, timer, resolve })
      worker.onmessage = ({ data }) => finish(data.result, data.error, data.offset)
      worker.onerror = () => finish(null, '处理失败，请重试或缩小内容。')
      worker.postMessage({ kind, action, input: session.input, options: { ...session.options } })
    } catch (error) {
      if (worker && jobs.has(session)) finish(null, error.message)
      else { session.status = 'error'; session.error = '无法启动处理，请刷新后重试。'; resolve(false) }
    }
  })
}
