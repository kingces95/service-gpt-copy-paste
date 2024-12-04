// Import required modules
import os from 'os'
import clipboardy from 'clipboardy'
import ora from 'ora'
import { debounce } from 'lodash-es'
import EventEmitterController from '@kingjs/event-emitter-controller'
import { handleShellRoute, normalizeShellRoute } from './shell-route.mjs'
import { handleRestCommand, normalizeRestRoute } from './rest-route.mjs'

const NEW_LINE = os.EOL
const POLL_MS = 200
const DEBOUNCE_MS = 300

class Canvas {
  constructor({ debounceMs, write }) {
    this.spinner = ora()
    this.accumulatedOutput = ''
    this.accumulatedError = ''
    this.state = ''
    this.debounceMs = debounceMs
    this.write = write
    this.writeHeadline = (headline) => this.spinner.text = headline
    this.debouncedWrite = debounce(this.write, this.debounceMs)
    this.debouncedWriteHeadline = debounce(this.writeHeadline, this.debounceMs)
  }

  static formatCharLabel(value) {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}m`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}k`
    }
    return value.toString()
  }

  formatHeadline(message) {
    const outputCharCount = this.accumulatedOutput.length
    const outputCountFormatted = Canvas.formatCharLabel(outputCharCount)
    
    const errorCharCount = this.accumulatedError.length
    const errorCountFormatted = Canvas.formatCharLabel(errorCharCount)
    
    let charCountFormatted = ''
    if (outputCharCount > 0 || errorCharCount > 0)
      charCountFormatted = `(${outputCountFormatted}/${errorCountFormatted})`
    return [message, charCountFormatted].filter(Boolean).join(' ')
  }
  
  async renderUpdate({ output = '', error = '', state = '' }) {
    this.accumulatedOutput += output
    this.accumulatedError += error

    const combinedOutput = [
      this.accumulatedOutput,
      this.accumulatedError ? '=== Error Output ===' : '',
      this.accumulatedError
    ].filter(Boolean).join(NEW_LINE)
    
    if (combinedOutput)
      this.debouncedWrite(combinedOutput)

    if (state)
      this.state = state

    this.debouncedWriteHeadline(this.formatHeadline(this.state))
  }

  async renderStart(state) {
    if (!this.spinner.isSpinning) {
      this.spinner.start()
    }
    this.renderUpdate({ state })
  }

  async renderProcessing(state) {
    this.renderUpdate({ state })
  }

  renderSuccess(message) {
    this.spinner.succeed(this.formatHeadline(message))
  }

  renderFailure(message) {
    this.spinner.fail(this.formatHeadline(message))
  }
}

async function handleThrowCommand() {
  throw new Error('This is a test error for handling purposes')
}

async function main() {
  let sigintController
  let canvas
  try {    
    await clipboardy.write('')

    while (true) {
      canvas = new Canvas({ 
        debounceMs: DEBOUNCE_MS,
        write: (output) => clipboardy.write(output)
      })
      
      // listen for command to be copied to clipboard
      await canvas.renderStart('Listening...')
      let clipboardContent
      while (true) {
        clipboardContent = await clipboardy.read()
        if (clipboardContent.startsWith('#!/clipboard/'))
          break
        await new Promise(resolve => setTimeout(resolve, POLL_MS))
      }
      
      // accumulate output to the clipboard
      await canvas.renderProcessing('Processing...')
      await clipboardy.write('')
      const accumulate = canvas.renderUpdate.bind(canvas)

      // initialize signal for aborting on SIGINT
      sigintController = new EventEmitterController(process, 'SIGINT')
      const sigint = sigintController.signal
      sigint.addEventListener('abort', () => {
        canvas.renderUpdate({ state: 'Interrupting...' })
      })

      const [firstLine, ...bodyLines] = (clipboardContent.trimEnd() + NEW_LINE).split(NEW_LINE)
      const [shebang, ...rest] = firstLine.trim().split(' ')
      const [_, _clipboard, route, ...routeRest] = shebang.split('/')

      switch (route) {
        case 'shell': {
          const { error, shell, commandRest, newLine } = normalizeShellRoute(routeRest.join('/'), rest)
          if (error) {
            canvas.renderFailure(`Shell command failed to execute: ${error}`)
            break
          }

          const command = commandRest.join(' ')
          const body = bodyLines.join(newLine)
          const { code, signal } = await handleShellRoute(
            shell, command, body, sigint, accumulate)

          if (code === 0) {
            canvas.renderSuccess('Shell command executed successfully')
          } else if (signal) {
            canvas.renderFailure(`Shell command terminated by signal: ${signal}`)
          } else {
            canvas.renderFailure(`Shell command exited with code: 0x${code.toString(16)}`)
          }          
          break
        }
        case 'throw': {
          await handleThrowCommand()
          canvas.renderSuccess('Throw command executed successfully')
          break
        }
        case 'rest': {
          const { error, method, commandRest } = normalizeRestRoute(routeRest.join('/'), rest)
          if (error) {
            canvas.renderFailure(`${method} failed to execute: ${error}`)
            break
          }

          const url = commandRest[0]
          const body = bodyLines.join(NEW_LINE)
          const { status } = await handleRestCommand(method, url, body, sigint, accumulate)
          if (status >= 200 && status < 300) {
            canvas.renderSuccess(`${method} executed successfully with status: ${status}`)
          } else {
            canvas.renderFailure(`${method} failed with status: ${status}`)
          }
          break
        }
        default:
          canvas.renderFailure(['Invalid route:', route].join(NEW_LINE))
      }

      sigintController.unregister()
    }
  } catch (error) {
    if (canvas)
      canvas.renderFailure('Internal error')
    console.error(error.stack)
  } finally {
    if (sigintController) 
      sigintController.unregister()
  }
}

main()
