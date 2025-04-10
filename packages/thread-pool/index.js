export class ThreadPool {
  #threads

  constructor() {
    // startable -> [controller, thread]
    this.#threads = new Map()
  }

  start(startable, ...args) {
    const class$ = startable.constructor

    if (typeof startable.start != 'function')
      throw new Error(`Class ${class$.name} must implement start() method.`)

    const controller = new AbortController()
    const thread = startable.start(controller.signal, ...args)
    this.#threads.set(startable, [controller, thread])
    return thread
  }

  async stop(startable) {
    const [controller, thread] = this.#threads.get(startable)
    
    if (!controller) throw new Error('Thread not started.')

    try {
      controller.abort()
      await thread
    } catch (error) { 
      // TODO: report errors
    }
  }
}
