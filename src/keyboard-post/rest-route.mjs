// Import required modules
import os from 'os'
import axios from 'axios'

const NEW_LINE_UNIX = '\n'
const NEW_LINE = os.platform() === 'win32' ? os.EOL : NEW_LINE_UNIX

async function handleRestCommand(method, url, body, signal, accumulate) {
  try {
    const response = await axios({
      method,
      url,
      data: body,
      responseType: 'stream',
      signal
    })

    response.data.on('data', async (chunk) => {
      const output = chunk.toString()
      await accumulate({ output })
    })

    try {
      // attempt to stream the response
      await new Promise((resolve, reject) => {
        response.data.on('end', resolve)
        response.data.on('error', reject)
      })
      return { status: response.status }

    } catch(error) {
      // a error occured during streaming of the response
      await accumulate({ error: `Error while streaming: ${e.message}` })
      return { status: error.response?.status }
    }
    
  } catch (error) {
    // an HTTP error occured before streaming began
    const errorBody = error.response ? error.response.data : ''
    const errorMessage = [
      'Request failed:', 
      error.message, 
      errorBody.toString()
    ].filter(Boolean).join(NEW_LINE)
    await accumulate({ error: errorMessage })
    return { status: error.response?.status }
  }
}

function normalizeRestRoute(restRoute, commandRest) {
  switch (restRoute) {
    case 'get':
      return { method: 'GET', commandRest }
    case 'post':
      return { method: 'POST', commandRest }
    case 'put':
      return { method: 'PUT', commandRest }
    case 'delete':
      return { method: 'DELETE', commandRest }
    case 'patch':
      return { method: 'PATCH', commandRest }
    case 'head':
      return { method: 'HEAD', commandRest }
    default:
      return { error: `No such REST route: rest/${restRoute}` }
  }
}

export { handleRestCommand, normalizeRestRoute }
