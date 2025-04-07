import { CliServiceThread } from '@kingjs/cli-service'

export class CliThreadPool {
  #threads

  constructor() {
    this.#threads = []
  }

  start(startable, ...args) {
    const class$ = startable.constructor

    if (!(startable instanceof CliServiceThread))
      throw new Error([`Class ${class$.name}`,
        `must extend ${CliServiceThread.name}.`].join(' '))

    if (this.#threads.some(([started]) => started === class$))
      throw new Error([`CliServiceThread ${class$.name}`,
        `is already started.`].join(' '))

    const controller = new AbortController()
    const thread = startable.start(controller.signal, ...args)
    this.#threads.push([class$, controller, thread])
    return thread
  }

  async stop() {
    while (this.#threads.length) {
      const [class$, controller, thread] = this.#threads.shift()
      try {
        controller.abort()
        await thread
      } catch (error) { 
        // TODO: report errors
      }
    }
  }
}
