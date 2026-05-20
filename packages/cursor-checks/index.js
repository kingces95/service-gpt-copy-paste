import { Probe } from '@kingjs/probe'

export class DefaultConstructible {
  static [Symbol.hasInstance](type) {
    if (typeof type != 'function')
      throw new TypeError('Argument must be a constructor.')

    try {
      new type()
      return true
    }
    catch (error) {
      throw new TypeError(
        `${type.name} must be default constructible.`, { cause: error })
    }
  }
}

export class PushProbe extends Probe {
  push(value) { }
}

class HasFunction {
  static [Symbol.hasInstance](type) {
    if (typeof type?.prototype?.[this.name] == 'function')
      return true

    throw new TypeError(
      `${type?.name ?? 'Type'} must define ${this.name}(value).`)
  }
}

export class PushBackContainer extends HasFunction {
  static get name() { return 'push' }
}
