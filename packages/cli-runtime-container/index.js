import { CliService } from '@kingjs/cli-service'
import { CliRuntimeActivator } from '@kingjs/cli-runtime-activator'
import { CliServiceProvider, CliServiceThread } from '@kingjs/cli-service'
import { ThreadPool } from '@kingjs/thread-pool'
import { Container } from '@kingjs/container'
import { EventEmitter } from 'events'

export class CliRuntimeContainer extends EventEmitter {
  static #activateFn(class$, options) {
    const prototype = class$.prototype

    if (prototype instanceof CliService)
      return new class$(options)

    if (prototype instanceof CliServiceProvider)
      // returns a promise of a provider which is used to activate an instance
      return new CliRuntimeActivator(class$).activate(options)

    throw new Error([`Class ${class$.name} must extend`,
      `${CliService.name} or ${CliServiceThread.name}.`
    ].join(' '))
  }

  static #activatedFn(instanceOrProvider) {
    return instanceOrProvider instanceof CliServiceProvider
      ? instanceOrProvider.activate()
      : instanceOrProvider
  }

  #container
  #threadPool
  #eventHub

  constructor(eventHub) {
    super()
    this.#eventHub = eventHub
    this.#threadPool = new ThreadPool()
    this.#container = new Container({
      // if CliService, then activate instance
      // if CliServiceProvider, then 
      //  return promise of provider as function of discriminator option
      activateFn: CliRuntimeContainer.#activateFn,

      // instance: already activated
      // provider: use provider to activate instance
      activatedFn: CliRuntimeContainer.#activatedFn,

      // - eventHub: if CliService, register instance producer/consumer events
      // - threadPool: if CliServiceThread, start thread
      activatedSyncFn: this.#activatedSyncFn.bind(this),

      // walk transposed service DAG:
      // - threadPool: if CliServiceThread, then stop thread
      // - eventHub: if CliService, then quiesce producer/consumer events
      //   - e.g., CliConsoleMon and CliPulse are equal in the DAG.
      //    So CliConsoleMon could be disposed before CliPulse.
      //    If that happens, then the eventHub will ensure that CliPulse
      //    events are prevented from reaching a disposed CliConsoleMon.
      // - container: if CliService, then call dispose on instance
      disposeFn: this.#disposeFn.bind(this),
    })
  }

  #activatedSyncFn(instance) {
    if (instance instanceof CliService)
      this.#eventHub.register(instance)

    if (instance instanceof CliServiceThread)
      this.#threadPool.start(instance)

    return instance
  }

  async #disposeFn(instance) {
    if (instance instanceof CliServiceThread)
      await this.#threadPool.stop(instance)

    if (instance instanceof CliService) {
      this.#eventHub.quiesce(instance)
      instance.dispose()
    }

    this.#container.dispose(instance)
  }

  activate(class$, options) {
    return this.#container.activate(class$, options)
  }

  async dispose(class$) {     
    await this.#container.dispose(class$)
  }
}
