export function decorate(fn, target, tag) {
  fn.__target = target

  Object.defineProperty(fn, 'name', {
    value: target.name + '_' + tag,
    configurable: true,
  })

  return fn
}

