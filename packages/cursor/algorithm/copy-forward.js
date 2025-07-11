export function copyForward(first, last, result) {
  while (!first.equals(last)) {
    result.set(first.get())
    first.step()
    result.step()
  }
  return result
}
