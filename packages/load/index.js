
export class LoadAsync {
  constructor(executor) {
    this.promise = null
    this.executor = executor
  }

  async load(selector) {
    if (!this.promise) {
      this.promise = this.executor()
    }
    
    let value = await this.promise
    if (selector) {
      value = selector(value)
    }

    return value
  }
}

export class LoadAsyncGenerator {
  constructor(generator, context) {
    this.generator = generator
    this.context = context
    this.cache = null
    this.iterator = null
  }

  async load() {
    if (!this.cache) {
      this.cache = []
      this.iterator = this.generator.call(this.context)
      for await (let item of this.iterator) {
        this.cache.push(item)
      }
    }

    return this.cache
  }
}