export async function toArray(iterable) {
  const result = []

  for await (const item of iterable)
    result.push(item)

  return result
}
