import { EventEmitter } from 'events'

class EventHubSubscription {
  #disposeFn
  #producer
  #consumer

  constructor(producer, consumer, event) {
    this.#producer = producer
    this.#consumer = consumer

    const handler = (...args) => { consumer.emit(event, ...args) }
    producer.on(event, handler)
    this.#disposeFn = () => { producer.off(event, handler) }
  }

  get producer() { return this.#producer }
  get consumer() { return this.#consumer }

  dispose() {
    if (!this.#disposeFn) return
    this.#disposeFn()
    this.#disposeFn = null
  }
}

class EventHubSubject {
  #subscriptions
  #instance
  #produces
  #consumes

  constructor(instance, produces, consumes) {
    this.#instance = instance
    this.#produces = new Set(produces)
    this.#consumes = new Set(consumes)
    this.#subscriptions = new Set()
  }

  on(event, handler) { this.#instance.on(event, handler) }
  off(event, handler) { this.#instance.off(event, handler) }
  emit(event, ...args) { this.#instance.emit(event, ...args) }

  get produces() { return this.#produces }
  get consumes() { return this.#consumes }
  get subscriptions$() { return this.#subscriptions }

  register(consumer) {
    const producer = this

    for (const event of producer.produces) {
      if (consumer.consumes.has(event)) {
        const subscription = new EventHubSubscription(producer, consumer, event)
        consumer.subscriptions$.add(subscription)
        this.#subscriptions.add(subscription)
      }
    }
  }

  dispose() {
    for (const subscription of this.#subscriptions) {
      subscription.dispose()

      const { consumer, producer } = subscription
      consumer.subscriptions$.delete(subscription)
      producer.subscriptions$.delete(subscription)
    }
  }
}

export class EventHub {
  #subjects

  constructor() {
    this.#subjects = new Map()
  }

  register(instance, { produces = [], consumes = [] } = {}) {
    // console.log(`EventHub register: ${instance.constructor.name}`)
    // console.log(`  produces: ${produces}`)
    // console.log(`  consumes: ${consumes}`)

    if (!(instance instanceof EventEmitter))
      throw new Error([`Class ${instance.constructor?.name}`,
        `must extend ${EventEmitter.name}.`].join(' '))

    const newSubject = new EventHubSubject(instance, produces, consumes)
    for (const subject of this.#subjects.values()) {
      subject.register(newSubject)
      newSubject.register(subject)
    }
    this.#subjects.set(instance, newSubject)
  }

  quiesce(instance) {
    const subject = this.#subjects.get(instance)
    if (!subject)
      throw new Error([`Class ${instance.constructor.name}`,
        `is not registered with the event hub.`].join(' '))

    subject.dispose()
    this.#subjects.delete(instance)
  }
}