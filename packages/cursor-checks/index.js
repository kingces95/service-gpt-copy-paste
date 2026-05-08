import { Check } from '@kingjs/function-contract'

export class DefaultConstructible extends Check {
  static check(Type) {
    if (typeof Type != 'function')
      throw new TypeError('Argument must be a constructor.')

    try {
      new Type()
    }
    catch (error) {
      throw new TypeError(
        `${Type.name} must be default constructible.`, { cause: error })
    }
  }
}

export class PushBackContainer extends Check {
  static check(Type) {
    if (typeof Type?.prototype?.push == 'function') return

    throw new TypeError(
      `${Type?.name ?? 'Type'} must define push(value).`)
  }
}
