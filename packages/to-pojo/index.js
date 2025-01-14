import _ from 'lodash'

export const toPojoSymbol = Symbol('to-pojo-metadata')

export function toPojo(info) {
  const [_, pojo] = toPojo$(this) 
  return pojo
}

function toPojo$(info) {
  const result = {
    [toPojoSymbol]: info
  }
  let name = null

  for (const key in info.constructor[toPojoSymbol]) {
    const type = info.constructor[toPojoSymbol][key]
    if (type === undefined) {
      continue
    }

    const value = info[key]

    if (
      // Exclude undefined/null values
      value === undefined || value === null ||
      // Exclude false booleans
      (type === 'boolean' && value === false) ||
      // Exclude empty arrays
      (Array.isArray(value) && value.length === 0) ||
      // Exclude empty strings
      (type === 'string' && value.length === 0)
    ) {
      continue
    }

    if (key === 'name') {
      name = value
    }

    if (type === 'map') {
      const map = {}
      for (const item of _.sortBy([...value.call(info)], o => o.name)) {
        const [name, pojo] = toPojo$(item)
        map[name] = pojo
        delete pojo.name
      }
      if (Object.getOwnPropertyNames(map).length === 0) {
        continue // Exclude empty maps
      }
      result[key] = map
      continue
    }

    if (type === 'list') {
      const list = []
      for (const item of value.call(info)) {
        const [_, pojo] = toPojo$(item)
        list.push(pojo)
      }
      if (list.length === 0) {
        continue // Exclude empty lists
      }
      result[key] = list
      continue
    }

    result[key] = value
  }

  return [name, result]
}
