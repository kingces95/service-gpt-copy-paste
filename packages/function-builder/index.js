export class FunctionBuilder {
  static require(functions = []) {
    const fns = Array.from(functions).filter(Boolean)
    if (fns.length === 0) return null
    if (fns.length === 1) return fns[0]
    return function() {
      for (const fn of fns)
        fn.apply(this, arguments)
    }
  }
}
