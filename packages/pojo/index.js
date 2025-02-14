async function getOrCall(target, name) {
  const functionOrValue = target[name]
  return await (typeof functionOrValue == 'function' 
    ? functionOrValue.call(target) 
    : functionOrValue)
}

export async function toPojo(value, symbol) {
  
  async function _toPojo(value, type) {
    const jsType = typeof value

    if (value === null || value === undefined)
      return

    if (jsType == 'object' && !Array.isArray(value)) {
      if (value[Symbol.iterator])
        value = [...value]
    
      if (value[Symbol.asyncIterator])
        value = await Promise.all(value)
    }

    if (!type && Array.isArray(value))
      type = 'list'

    if (!type) {
      switch (jsType) {
        case 'symbol':
        case 'function':
          return

        case 'number':
        case 'bigint':
        case 'boolean':
        case 'string':
          return value
          
        case 'object': {
          const metadata = value.constructor?.[symbol]
          const isPojo = Object.getPrototypeOf(value) === Object.prototype

          // if there is no metadata, then ignore unless it is a plain object.
          if (!metadata && !isPojo)
            throw new Error(`Object must be pojo or have metadata`)

          // if there is no metadata, then transform all properties to pojos.
          if (!metadata) {
            const result = { }
            for (const key in value) {
              result[key] = await _toPojo(value[key])
            }
            return result
          } 
          
          // if metadata is a string, return the value of the property
          if (typeof metadata == 'string') {
            return await _toPojo(await getOrCall(value, metadata))
          }

          // if metadata is an object, then transform properties with metadata.
          const result = { }
          for (const key in metadata) {
            let type = metadata[key]
            result[key] = await _toPojo(await getOrCall(value, key), type)
          }
          return result
        }

        case 'array':
          const array = []
          for (const item of value) {
            array.push(await _toPojo(item))
          }
          return array
      
        default:
          throw new Error(`unexpected type: ${jsType}`)
      }
    }

    switch (type) {
      case 'number':
        if (jsType != type && jsType != 'bigint')
          throw new Error(`Pojo number type must be typeof number or bigint; got ${jsType}`)
        return _toPojo(value)

      case 'string':
        if (jsType != type)
          throw new Error(`Pojo string type must be typeof string; got ${jsType}`)
        return _toPojo(value)
        
      case 'boolean':
        if (jsType != type)
          throw new Error(`Pojo boolean type must be typeof boolean; got ${jsType}`)
        return _toPojo(value)

      case 'url':
        if (value && !(value instanceof URL))
          throw new Error(`Pojo url type must be instanceof URL`)
        return _toPojo(value?.toString())

      case 'any':
        if (jsType == 'function')
          throw new Error(`Pojo any type must not be typeof function`)
        return _toPojo(value)

      case 'list': {
        if (jsType != 'object')
          throw new Error(`Pojo list type must be typeof object; got ${jsType}`)
        if (!Array.isArray(value))
          throw new Error(`Pojo list type must be Array.isArray`)
        const list = []
        for (const item of value) {
          list.push(await _toPojo(item))
        }
        return list
      }
      
      case 'infos': {
        const infos = await _toPojo(value, 'list')
        const entries = []
        for (const info of infos) {
          if (!Object.hasOwn(info, 'name')) 
            throw new Error(`Pojo info object must have a name property`)
        
          const name = info.name
          delete info.name
          
          entries.push([name, info])
        }
        return Object.fromEntries(entries)
      }

      default:
        throw new Error(`Unexpected pojo type: ${type}`)
    }
  }

  return _toPojo(value)
}
