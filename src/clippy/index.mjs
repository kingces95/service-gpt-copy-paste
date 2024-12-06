// Import required modules
import clipboardy from 'clipboardy'
import EventEmitterController from '@kingjs/event-emitter-controller'
import { interval } from 'rxjs'
import { switchMap, filter, first, throttleTime } from 'rxjs/operators'
import Clippy from './clippy.mjs'
import Terminal from './terminal.mjs'
import Accumulator from './accumulator.mjs'
import AwaitProxy from './await-proxy.mjs'

const POLL_MS = 200
const THROTTLE_MS = 200

async function startListening() {
  const clippy = new Clippy()
  const accumulator = new Accumulator()
  const terminal = new AwaitProxy(new Terminal(), {
    pipeline: (source) => source.pipe(throttleTime(THROTTLE_MS)),
    executor: (resolve, reject) => {
      clippy.on('end', resolve) // Resolves when clippy signals that it's done
    }
  })

  // Listen to data from accumulator and feed updates to the terminal
  accumulator.on('data', ({ outputCount, errorCount }) => {
    terminal.renderUpdate({ outputCount, errorCount })
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

  terminal.renderUpdate({ state: 'Listening...' })

  interval(POLL_MS).pipe(
    switchMap(() => clipboardy.read()),
    filter(Clippy.isScript),
    first()
  ).subscribe({
    next: async (clipboardContent) => {
      // Create a signal for aborting on SIGINT
      const sigintController = new EventEmitterController(process, 'SIGINT')
      try {
        const signal = sigintController.signal
        signal.addEventListener('abort', () => {
          terminal.renderUpdate({ state: 'Interrupting...' })
        })

        terminal.renderUpdate({ state: 'Processing...' })
        await clipboardy.write('') // Clear clipboard
        await clippy.processScript(clipboardContent, signal)
        await terminal // Wait for all terminal tasks to complete
        startListening() // Restart listening after the terminal completes rendering
      } catch (error) {
        terminal.renderFailure('Internal Error')
        console.log(error.stack)
      } finally {
        // Cleanup after command execution
        sigintController.unregister()
      }
    },
    error: (error) => {
      terminal.renderFailure('Internal Error')
      console.log(error.stack)
    }
  })
}

startListening()
