export function cliTypeof(value) {
  if (value === undefined) {
    return undefined
  } else if (value === null) {
    return 'string'
  } else if (value == String) {
    return 'string'
  } else if (value == Number) {
    return 'number'
  } else if (value == Boolean) {
    return 'boolean'
  } else {
    const defaultType = typeof value
    if (defaultType === 'string') {
      return 'string'
    } else if (defaultType == 'number') {
      return 'number'
    } else if (defaultType == 'boolean') {
      return 'boolean'
    }
  }

  return 'string'
}
