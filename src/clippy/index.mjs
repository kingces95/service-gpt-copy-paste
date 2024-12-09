// Import required modules
import clipboardy from 'clipboardy'
import EventEmitterController from '@kingjs/event-emitter-controller'
import Clippy from './clippy.mjs'
import Terminal from './terminal.mjs'
import Accumulator from './accumulator.mjs'
import AwaitProxy from './await-proxy.mjs'
import pollUntil from './poll-unil.mjs'
import Clipboard from './clipboard.mjs'

const DELAY_MS = 200
const RETRY = 4

async function startListening() {
  const clippy = new Clippy()
  const accumulator = new Accumulator()
  const clipboard = new AwaitProxy(new Clipboard(), {
    throttle: { renderUpdate: { ms: DELAY_MS } },
    retry: { renderUpdate: { attempts: RETRY, ms: DELAY_MS } }
  })
  const terminal = new AwaitProxy(new Terminal(), {
    throttle: { renderUpdate: { ms: DELAY_MS } },
    end: [ 'renderSuccess', 'renderWarning', 'renderFailure' ]
  })

  clippy.on('update', (data) => {
    accumulator.accumulate(data)
  })

  clippy.on('success', (message) => {
    clipboard[AwaitProxy.END_METHOD]()
    terminal.renderSuccess(message)
  })

  clippy.on('warning', (message) => {
    clipboard[AwaitProxy.END_METHOD]()
    terminal.renderWarning(message)
  })

  clippy.on('failure', (message) => {
    clipboard[AwaitProxy.END_METHOD]()
    terminal.renderFailure(message)
  })

  // Update with accumulated data
  accumulator.on('data', (data) => {
    terminal.renderUpdate(data)
    clipboard.renderUpdate(data)
  })

  terminal.renderUpdate({ state: 'Listening...' })

  pollUntil({
    fetch: () => clipboardy.read(),
    test: Clippy.isScript,
    next: async (clipboardContent) => {
      let sigintController
      try {
        // Create a signal for aborting on SIGINT
        sigintController = new EventEmitterController(process, 'SIGINT')
        const signal = sigintController.signal
        signal.addEventListener('abort', () => {
          terminal.renderInterrupt('Interrupting...')
        })

        terminal.renderStart('Processing...')
        clipboard.renderStart()
        await clippy.processScript(clipboardContent, signal)
        await terminal // Wait for all terminal tasks to complete
        await clipboard
        startListening() // Restart listening after the terminal completes rendering
      } catch(error) {
        console.log('Internal error during script processing.')
        console.log(error?.stack || error)
      } finally {
        // Cleanup after command execution
        if (sigintController)
          sigintController.unregister()
      }
    },
    error: (error) => {
      console.log('Internal error during polling.')
      console.log(error?.stack || error)
    }
  })
}

startListening()
