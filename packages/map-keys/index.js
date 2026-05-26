export function mapKeys(pojo, callback) {
  if (!pojo) return

  return Object.fromEntries(
    Reflect.ownKeys(pojo).map(key => [
      key,
      callback(pojo[key], key),
    ])
  )
}
