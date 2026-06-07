import { Shape } from '@kingjs/partial-shape'

export class PushBackContainerShape extends Shape {
  pushBack(value) { }
}

export class SizedContainerShape extends Shape {
  get size() { }
}

export function isPushBackContainer(container) {
  return container instanceof PushBackContainerShape
}
