import { iterate } from './iterate.js'

export function toArray(range, map = value => value) {
  const result = []

  for (const value of iterate(range))
    result.push(map(value))

  return result
}
