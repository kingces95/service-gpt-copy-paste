import { asIterable } from "@kingjs/as-iterable"

export class FunctionBuilder {
  static require(functions = []) {
    const fns = [...asIterable(functions).filter(Boolean)]
    if (fns.length === 0) return null
    if (fns.length === 1) return fns[0]

    return function() {
      for (let i = 0; i < fns.length; i++)
        fns[i].apply(this, arguments)
    }
  }
}
