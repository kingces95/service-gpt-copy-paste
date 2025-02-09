export class Lazy {
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

export class LazyGenerator extends Lazy {
  constructor(generator, scope) {
    super(() => [...generator.call(scope)])
  }
}