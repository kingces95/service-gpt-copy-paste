export function copyBackward(first, last, result) {
  while (!last.equals(first)) {
    last.stepBack()
    result.stepBack()
    result.value = last.value
  }
  return result
}
