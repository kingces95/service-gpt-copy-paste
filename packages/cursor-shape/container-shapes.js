import { Shape } from '@kingjs/partial-shape'

export class PushBackContainerShape extends Shape {
  pushBack(value) { }
}

export function isPushBackContainer(container) {
  return container instanceof PushBackContainerShape
}
