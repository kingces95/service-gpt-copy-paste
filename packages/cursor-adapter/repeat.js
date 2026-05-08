import { RepeatView } from "@kingjs/cursor-view"
import { pipe } from "./pipe.js"
import { take } from "./take.js"

export function repeat(value, count = Infinity) {
  if (count != Infinity)
    return pipe(repeat(value), take(count))

  return new RepeatView(value)
}
