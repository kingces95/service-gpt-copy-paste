export function trimPojo(object, options = { }) {
  const { values = [undefined, false, null] } = options

  if (Array.isArray(object)) {
    if (object.length === 0) return

    return object
      .map(trimPojo)
      .filter(value => !values.includes(value))
  }

  if (object !== null && typeof object === "object") {
    if (Object.keys(object).length === 0) return

    return Object.keys(object).reduce((result, key) => {
      const trimmedValue = trimPojo(object[key], options)
      if (!values.includes(trimmedValue)) {
        result[key] = trimmedValue
      }
      return result
    }, { })
  }

  return object
}
