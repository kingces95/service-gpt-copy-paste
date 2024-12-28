import { Observable, timer, concatMap, retryWhen, tap, finalize, first, filter } from 'rxjs'
import EventEmitter from 'events'
import clipboardy from 'clipboardy'
import Clippy from './clippy.mjs'
import Accumulator from './accumulator.mjs'
import AwaitProxy from './await-proxy.mjs'
import Clipboard from './clipboard.mjs'

const DELAY_MS = 200
const RETRY = 4

export default class Service extends EventEmitter {
  static async processScript(emit, signal, script) {
    const clippy = new Clippy()
    const accumulator = new Accumulator()
    const clipboard = new AwaitProxy(new Clipboard(), {
      throttle: { renderUpdate: { ms: DELAY_MS } },
      retry: { renderUpdate: { attempts: RETRY, ms: DELAY_MS } },
    })

    Service.setupEventHandlers(emit, clippy, accumulator, clipboard)

    try {
      await clipboard.renderStart()
      await clippy.processScript(script, signal)
      await clipboard
    } finally {
      clippy.removeAllListeners()
      accumulator.removeAllListeners()
    }
  }

  static createWorkflow(emit) {
    return new Observable((subscriber) => {
      const abortController = new AbortController()
      const signal = abortController.signal
      const abort = abortController.abort.bind(abortController)
      emit('listening')

      const subscription = timer(0, 1000)
        .pipe(
          concatMap(() => clipboardy.read()),
          retryWhen((errors) =>
            errors.pipe(
              tap(() => emit('retrying')),
              concatMap(() => timer(2000))
            )
          ),
          filter((copy) => Clippy.isScript(copy)),
          first(),
          tap((script) => emit('processing', { script, abort })),
          concatMap((script) => Service.processScript(emit, signal, script)),
          finalize(() => abortController.abort())
        )
        .subscribe(subscriber)

      return () => {
        abortController.abort()
        subscription.unsubscribe()
      }
    })
  }

  static setupEventHandlers(emit, clippy, accumulator, clipboard) {
    clippy.on('update', (data) => {
      accumulator.accumulate(data)
    })

    clippy.on('success', (message) => {
      clipboard[AwaitProxy.END_METHOD]()
      emit('success', message)
    })

    clippy.on('warning', (message) => {
      clipboard[AwaitProxy.END_METHOD]()
      emit('warning', message)
    })

    clippy.on('failure', (message) => {
      clipboard[AwaitProxy.END_METHOD]()
      emit('failure', message)
    })

    accumulator.on('data', (data) => {
      clipboard.renderUpdate(data)
      emit('data', data)
    })
  }

  constructor() {
    super()
    this.subscription = null
  }

  start() {
    if (this.subscription)
      return false

    this.emit('start')
    this.workflow = new Promise((resolve, reject) => {
      this.subscription = Service.createWorkflow(
        this.emit.bind(this)
      ).subscribe({
        error: (err) => {
          this.emit('error', err)
          reject(err)
        },
        complete: () => {
          resolve()
          this.restart()
        },
      })      
    })

    return true
  }

  async stop() {
    if (!this.subscription)
      return false

    this.subscription.unsubscribe()
    this.subscription = null

    await this.workflow
    this.emit('stop')

    return true
  }

  async restart() {
    await this.stop()
    this.start()
  }
}
