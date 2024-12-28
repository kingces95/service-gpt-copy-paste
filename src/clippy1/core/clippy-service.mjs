// Import required modules
import EventEmitter from 'events'
import clipboardy from 'clipboardy'
import EventEmitterController from '@kingjs/event-emitter-controller'
import Clippy from './clippy.mjs'
import Accumulator from './accumulator.mjs'
import AwaitProxy from './await-proxy.mjs'
import pollUntil from './poll-unil.mjs'
import Clipboard from './clipboard.mjs'

const DELAY_MS = 200
const RETRY = 4

class ClippyService extends EventEmitter {
  constructor() {
    super()
    this.clippy = new Clippy()
    this.accumulator = new Accumulator()
    this.clipboard = new AwaitProxy(new Clipboard(), {
      throttle: { renderUpdate: { ms: DELAY_MS } },
      retry: { renderUpdate: { attempts: RETRY, ms: DELAY_MS } }
    })
    this.setupEventHandlers()
  }

  static start(initializeUi) {
    const service = new ClippyService()
    initializeUi(service)
    service.listen(initializeUi)
  }

  listen(initializeUi) {
    this.emit('listening')

    pollUntil({
      fetch: () => clipboardy.read(),
      test: Clippy.isScript,
      next: async (clipboardContent) => {
        let sigintController
        try {
          sigintController = new EventEmitterController(process, 'SIGINT')
          const signal = sigintController.signal
          signal.addEventListener('abort', () => {
            this.emit('interrupt')
          })

          this.emit('processing')
          await this.clipboard.renderStart()
          await this.clippy.processScript(clipboardContent, signal)
          await this.clipboard

          // Restart listening after the clipboard completes rendering
          ClippyService.start(initializeUi) 
        } catch (error) {
          this.emit('error', error)
          console.log('Internal error during script processing.')
          console.log(error?.stack || error)
        } finally {
          if (sigintController) sigintController.unregister()
        }
      },
      error: (error) => {
        this.emit('error', error)
        console.log('Internal error during polling.')
        console.log(error?.stack || error)
      }
    })
  }

  setupEventHandlers() {
    this.clippy.on('update', (data) => {
      this.accumulator.accumulate(data)
    })

    this.clippy.on('success', (message) => {
      this.clipboard[AwaitProxy.END_METHOD]()
      this.emit('success', message)
    })

    this.clippy.on('warning', (message) => {
      this.clipboard[AwaitProxy.END_METHOD]()
      this.emit('warning', message)
    })

    this.clippy.on('failure', (message) => {
      this.clipboard[AwaitProxy.END_METHOD]()
      this.emit('failure', message)
    })

    this.accumulator.on('data', (data) => {
      this.clipboard.renderUpdate(data)
      this.emit('data', data)
    })
  }
}

export default ClippyService
