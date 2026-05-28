import { declareName } from '@kingjs/es6-define'

export function decorate(fn, target, tag) {
  fn.__target = target

  return declareName(fn, target.name + '_' + tag)
}
