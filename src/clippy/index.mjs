// Import required modules
import clipboardy from 'clipboardy'
import EventEmitterController from '@kingjs/event-emitter-controller'
import Clippy from './clippy.mjs'
import Terminal from './terminal.mjs'
import Accumulator from './accumulator.mjs'
import AwaitProxy from './await-proxy.mjs'
import pollUntil from './poll-unil.mjs'
import Clipboard from './clipboard.mjs'

async function startListening() {
  const clippy = new Clippy()
  const accumulator = new Accumulator()
  const clipboard = new Clipboard()
  const terminal = new AwaitProxy(new Terminal(), {
    throttle: [ 'renderUpdate' ],
    end: [ 'renderSuccess', 'renderWarning', 'renderFailure' ]
  })
  
  clippy.on('update', (data) => {
    accumulator.accumulate(data)
  })

  clippy.on('success', (message) => {
    terminal.renderSuccess(message)
  })
  
  clippy.on('warning', (message) => {
    terminal.renderWarning(message)
  })
  
  clippy.on('failure', (message) => {
    terminal.renderFailure(message)
  })
  
  // Update clipboard with accumulated data
  accumulator.on('data', (data) => {
    clipboard.renderUpdate(data)
  })

  // Listen to data from accumulator and feed updates to the terminal
  accumulator.on('data', (data) => {
    terminal.renderUpdate(data)
  })
  
  await terminal.renderUpdate({ state: 'Listening...' })

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

        await terminal.renderStart('Processing...')
        await clipboard.renderStart()
        await clippy.processScript(clipboardContent, signal)
        await terminal // Wait for all terminal tasks to complete
        await startListening() // Restart listening after the terminal completes rendering
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
