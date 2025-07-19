import { getOwn } from '@kingjs/get-own'

function activatePrototypeChain(type, name) {
  return Reflection.link(
    [...Reflection.hierarchy(type)]
      .map(p => getOwn(p, name))
      .filter(value => value !== undefined)
  )
}

class Reflection {
  static baseOf(type) {
    return Object.getPrototypeOf(type.prototype)?.constructor
  }

  static* hierarchy(type) {
    for (let current = type; current; current = Reflection.baseOf(current))
      yield current
  }

  static link(prototypes) {
    return prototypes.reverse().reduce((reduction, prototype) => {
      return Object.setPrototypeOf(prototype, reduction)
    }, { })
  }
}
