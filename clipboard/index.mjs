import clipboardy from 'clipboardy'
import axios from 'axios'
import ora from 'ora'
import { URL } from 'url'

// Authentication constants
const TRELLO_API_KEY = ''
const TRELLO_API_TOKEN = ''

const TRELLO_AUTH = (url) => {
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.append('key', TRELLO_API_KEY)
  parsedUrl.searchParams.append('token', TRELLO_API_TOKEN)
  return { url: parsedUrl, headers: {} }
}

const GOOGLE_AUTH = (url) => {
  return {
    url: new URL(url),
    headers: {
      Authorization: `Bearer YOUR_GOOGLE_AUTH_TOKEN`
    }
  }
}

// Add more authentication logic here as needed
const AUTH_SCHEMES = {
  'gpt:': (url) => ({ url: new URL(url), headers: {} }), // No authentication needed for gpt
  'trello:': TRELLO_AUTH,
  'google:': GOOGLE_AUTH
}

function printError(error) {
  console.error(`An error occurred: ${error.message}`)
  console.error(error.stack)
}

function detectUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString)
    if (!AUTH_SCHEMES[parsedUrl.protocol])
      return null
    return parsedUrl
  } catch {
    return null
  }
}

function getRequest(parsedUrl) {
  const authFunction = AUTH_SCHEMES[parsedUrl.protocol]
  if (!authFunction)
    throw new Error('Unsupported protocol')

  const httpsUrl = parsedUrl.toString().replace(parsedUrl.protocol, 'https:')
  const requestConfig = authFunction(httpsUrl)
  if (requestConfig instanceof URL)
    return { url: requestConfig, headers: {} }

  return requestConfig
}

async function curl(commandUrl) {
  const parsedUrl = detectUrl(commandUrl)
  if (!parsedUrl)
    throw new Error('Invalid or unsupported URL')

  const { url, headers } = getRequest(parsedUrl)
  const response = await axios.get(url.toString(), { headers })

  return typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
}

async function processClipboard() {
  let spinner
  try {
    let current = await clipboardy.read()
    current = current.trim()

    const parsedUrl = detectUrl(current)
    if (!parsedUrl)
      return

    spinner = ora({ text: `${current}`, spinner: 'dots' }).start()

    const result = await curl(current)

    // Copy the result directly to the clipboard
    await clipboardy.write(result)

    spinner.succeed(`${current}`)
  } finally {
    if (spinner && spinner.isSpinning) spinner.stop()
  }
}

async function main() {
  // Start the clipboard processing loop
  while (true) {
    try {
      await processClipboard()
    } catch (error) {
      printError(error)
      break
    }
    await new Promise(resolve => setTimeout(resolve, 500)) // Polling interval
  }
}

main()
