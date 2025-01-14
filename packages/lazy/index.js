export default class Lazy {
  static fromGenerator(generator, scope) {
    return new Lazy(() => [...generator.call(scope)])
  }

  constructor(load) {
    this.load = load
  }

  get value() {
    if (!this.value$) {
      this.value$ = this.load()
    }
    return this.value$
  }
}