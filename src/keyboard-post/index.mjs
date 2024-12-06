// Import required modules
import os from 'os'
import { EventEmitter } from 'events'
import clipboardy from 'clipboardy'
import ora from 'ora'
import { debounce } from 'lodash-es'
import EventEmitterController from '@kingjs/event-emitter-controller'
import { Subject, interval } from 'rxjs'
import { switchMap, filter, first, concatMap } from 'rxjs/operators'
import { handleShellRoute, normalizeShellRoute } from './shell-route.mjs'
import { handleRestCommand, normalizeRestRoute } from './rest-route.mjs'

const NEW_LINE = os.EOL
const POLL_MS = 200
const DEBOUNCE_MS = 50

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

  renderWarning(message) {
    this.spinner.warn(this.formatHeadline(message))
  }

  renderFailure(message) {
    this.spinner.fail(this.formatHeadline(message))
  }
}

class Clippy extends EventEmitter {
  static isCommand(content) {
    return content.startsWith('#!/clipboard/')
  }

  async processCommand(command, signal) {
    let hasError = false
    const update = ({ output, error }) => {
      hasError = hasError || error
      this.emit('update', { output, error })
    }

    const [firstLine, ...bodyLines] = (command.trimEnd() + NEW_LINE).split(NEW_LINE)
    const [shebang, ...rest] = firstLine.trim().split(' ')
    const [_, _clipboard, route, ...routeRest] = shebang.split('/')

    this.emit('processing', 'Processing...')

    switch (route) {
      case 'shell': {
        const { error, shell, commandRest, newLine } = normalizeShellRoute(routeRest.join('/'), rest)
        if (error) {
          this.emit('failure', `Shell command failed to execute: ${error}`)
          return
        }

        const cmd = commandRest.join(' ')
        const body = bodyLines.join(newLine)
        const { code, signal: exitSignal } = await handleShellRoute(shell, cmd, body, signal, update)

        if (code === 0) {
          if (!hasError)
            this.emit('success', 'Shell command executed successfully')
          else
            this.emit('warning', `Shell command executed successfully but wrote to stderr`)
        } else if (exitSignal) {
          this.emit('failure', `Shell command terminated by signal: ${exitSignal}`)
        } else {
          this.emit('failure', `Shell command exited with code: 0x${code.toString(16)}`)
        }
        break
      }
      case 'throw': {
        throw new Error('This is an error thrown for testing.')
      }
      case 'rest': {
        const { error, method, commandRest } = normalizeRestRoute(routeRest.join('/'), rest)
        if (error) {
          this.emit('failure', `${method} failed to execute: ${error}`)
          return
        }

        const url = commandRest[0]
        const body = bodyLines.join(NEW_LINE)
        const { status } = await handleRestCommand(method, url, body, signal, update)
        if (status >= 200 && status < 300) {
          if (!hasError)
            this.emit('success', `${method} executed successfully with status: ${status}`)
          else
            this.emit('warning', `${method} executed successfully with status: ${status}, but wrote to stderr`)
        } else {
          this.emit('failure', `${method} failed with status: ${status}`)
        }
        break
      }
      default:
        this.emit('failure', `Invalid route: ${route}`)
    }
  }
}

async function startListening() {
  const canvas = new Canvas({
    debounceMs: DEBOUNCE_MS,
    write: (output) => clipboardy.write(output)
  })

  const eventSubject = new Subject()

  eventSubject.pipe(
    concatMap(task => task()) // Process tasks sequentially
  ).subscribe({
    complete: () => {
      startListening() // Restart listening after command processing completes
    },
    error: (error) => {
      canvas.renderFailure('Intenral Error')
      console.log(error.stack)
    },
  })

  const clippy = new Clippy()

  clippy.on('processing', (state) => {
    eventSubject.next(async () => canvas.renderProcessing(state))
  })

  clippy.on('update', (data) => {
    eventSubject.next(async () => canvas.renderUpdate(data))
  })

  clippy.on('success', (message) => {
    eventSubject.next(async () => canvas.renderSuccess(message))
  })

  clippy.on('warning', (message) => {
    eventSubject.next(async () => canvas.renderWarning(message))
  })

  clippy.on('failure', (message) => {
    eventSubject.next(async () => canvas.renderFailure(message))
  })

  canvas.renderStart('Listening...')

  interval(POLL_MS).pipe(
    switchMap(() => clipboardy.read()),
    filter(Clippy.isCommand),
    first()
  ).subscribe({
    next: async (clipboardContent) => {
      // Create a signal for aborting on SIGINT
      const sigintController = new EventEmitterController(process, 'SIGINT')
      try {
        const signal = sigintController.signal
        signal.addEventListener('abort', () => {
          canvas.renderUpdate({ state: 'Interrupting...' })
        })
        await clipboardy.write('') // Clear clipboard
        await clippy.processCommand(clipboardContent, signal)
      } catch (error) {
        eventSubject.error(error)
      } finally {
        sigintController.unregister() // Cleanup after command execution
        eventSubject.complete()
      }
    },
    error: (error) => {
      eventSubject.error(error)
    }
  })
}

startListening()
