export class Normalize {
  static ToArray(value) {
    if (value === undefined || value === null)
      return [ ]

    if (Array.isArray(value))
      return value

    return [ value ]
  }
}