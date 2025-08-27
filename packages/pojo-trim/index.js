// return false if value is empty array, empty object, null, or undefined
export function isTrimable(value) {
  if (value === null || value === undefined) return true

  if (Array.isArray(value)) {
    if (value.length === 0) return true
  }

  if (typeof value === "object") {
    if (Reflect.ownKeys(value).length === 0) 
      return true
  }

  return false
}

export function trimPojo(object) {
  if (isTrimable(object)) 
    return

  if (Array.isArray(object)) {
    let result = undefined
    for (const value of object) {
      const trimmed = trimPojo(value)
      if (trimmed === undefined) 
        continue
      if (!result) result = [ ]
      result.push(trimmed)
    }
    return result
  }

  if (typeof object === "object") {
    let result = undefined
    for (const key of Reflect.ownKeys(object)) {
      const value = object[key]
      const trimmed = trimPojo(value)
      if (trimmed === undefined) 
        continue
      if (!result) result = { }
      result[key] = trimmed
    }
    return result
  }

  return object
}
