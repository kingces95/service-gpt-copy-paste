import _ from 'lodash'

export function pojoTrim(object) {
  if (_.isArray(object)) {
    if (!object.length)
      return

    return object
      .map(pojoTrim)
      .filter(
        value => value !== null && 
                 value !== undefined && 
                 value !== false
      )
  }
  
  if (_.isObject(object)) {
    if (!Object.getOwnPropertyNames(object).length)
      return
    
    return _.transform(object, (result, value, key) => {
      const trimmedValue = pojoTrim(value)
      if (
        trimmedValue !== null && 
        trimmedValue !== undefined && 
        trimmedValue !== false
      ) {
        result[key] = trimmedValue
      }
    }, {})
  }
  
  return object
}
