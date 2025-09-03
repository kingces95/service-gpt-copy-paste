import { EventHub } from '@kingjs/event-hub'
import { Cli } from '@kingjs/cli'
import { assert } from '@kingjs/assert'

export class CliRuntimeEventHub {
  #eventHub

  constructor(instance, events) {
    this.#eventHub = new EventHub()
    this.#eventHub.register(instance, events)
  }

  register(instance) {
    assert(instance instanceof Cli)
    const class$ = instance.constructor
    const hierarchy = [...class$.hierarchy()]
    const produces = [...new Set(hierarchy.map(o => [...o.ownProduces()]).flat())]
    const consumes = [...new Set(hierarchy.map(o => [...o.ownConsumes()]).flat())]
    this.#eventHub.register(instance, { produces, consumes })
  }

  quiesce(instance) {
    this.#eventHub.quiesce(instance)
  }
}