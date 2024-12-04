export default class EventEmitterController {
  constructor(emitter, event) {
    this.emitter = emitter
    this.event = event
    this.abortController = new AbortController()
    this.handler = () => this.abortController.abort()
    this.emitter.on(this.event, this.handler)
  }

  get signal() {
    return this.abortController.signal
  }

  unregister() {
    this.emitter.off(this.event, this.handler)
  }
}