import { processData } from '../utils/operations.js'

self.onmessage = ({ data }) => {
  try { self.postMessage({ result: processData(data) }) }
  catch (error) { self.postMessage({ error: error.message, offset: error.offset }) }
}
