import _ from 'lodash'

const toPojoSymbol = Symbol('to-pojo-metadata')

async function objectToPojo(object, options = {}) {
  const [_, pojo] = await infoToPojo(object, options) 
  return pojo
}

async function infoToPojo(info, options = { }) {
  const result = { }
  const { attachSource } = options

  if (attachSource) {
    result[toPojoSymbol] = info
  }

  let name = null

  for (const key in info.constructor[toPojoSymbol]) {
    
    // load key type
    const type = info.constructor[toPojoSymbol][key]
    if (type === undefined) {
      continue
    }

    const valueOrPromise = 
      typeof info[key] == 'function' 
        ? info[key].call(info) 
        : info[key]

    const value = await nonObjectToPojo(valueOrPromise, type, options)
    if (value === undefined) {
      continue
    }

    if (key === 'name') {
      name = value
    }
    
    result[key] = value
  }

  return [name, result]
}

async function arrayToPojo(array, options = { }) {
  return await nonObjectToPojo(array, 'list', options)
}

async function mapToPojo(array, options = { }) {
  return await nonObjectToPojo(array, 'map', options)
}

async function nonObjectToPojo(valueOrPromise, type, options = { }) {

  // load value (assume functions are getters and possibly async)
  const value = await valueOrPromise
    
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
    return
  }

  if (type === 'map') {
    const map = {}
    const list = [...value]
    for (const item of _.sortBy(list, o => o.name)) {
      const [name, pojo] = await infoToPojo(item, options)
      map[name] = pojo
      delete pojo.name
    }
    if (Object.getOwnPropertyNames(map).length === 0) {
      return // Exclude empty maps
    }
    return map
  }

  if (type === 'list') {
    const list = []
    for (const item of value) {
      if (typeof item !== 'object') { 
        list.push(item)
        continue
      }
      
      const [_, pojo] = await infoToPojo(item, options)
      list.push(pojo)
    }
    if (list.length === 0) {
      return // Exclude empty lists
    }
    return list
  }

  return value
}

export {
  objectToPojo,
  infoToPojo,
  arrayToPojo,
  mapToPojo,
  toPojoSymbol,
}