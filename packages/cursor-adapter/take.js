import { TakeView } from "@kingjs/cursor-view"

export function take(count) {
  return (range) => new TakeView(range, count)
}
