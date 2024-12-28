// Import required modules
import os from 'os'
import axios from 'axios'

const NEW_LINE = os.EOL

function normalize(route, args) {
  switch (route) {
    case 'get':
      return { method: 'GET', args }
    case 'post':
      return { method: 'POST', args }
    case 'put':
      return { method: 'PUT', args }
    case 'delete':
      return { method: 'DELETE', args }
    case 'patch':
      return { method: 'PATCH', args }
    case 'head':
      return { method: 'HEAD', args }
    default:
      throw new Error(`No such route: ${route}`)
  }
}

export default async function spawnRestRequest(route, args, bodyLines, signal, write) {
  const { method, args: normalizedArgs } = normalize(route[0], args)
  const url = normalizedArgs[0]

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({
        method,
        url,
        data: bodyLines.join(NEW_LINE),
        responseType: 'stream',
        signal
      })

      let localError = null

      response.data.on('data', (chunk) => write({ output: chunk.toString() }))

      response.data.on('error', (error) => {
        localError = `Error while streaming: ${error.message}`
        write({ error: localError })
      })

      response.data.on('end', () => {
        resolve({ status: response.status, error: !!localError })
      })
    } catch (error) {
      if (error.response) {
        // Server-side error
        const errorBody = error.response.data ? error.response.data : ''
        const errorMessage = [
          'Server Error:',
          error.message,
          errorBody.toString()
        ].filter(Boolean).join(NEW_LINE)
        write({ error: errorMessage })
        resolve({ status: error.response.status, error: errorMessage })
      } else {
        // Client-side error
        reject(error)
      }
    }
  })
}
