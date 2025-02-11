const toPojoSymbol = Symbol('to-pojo-metadata')

async function toPojo(value, type) {
  if (value === null || value === undefined)
    return

  if (typeof value == 'object') {
    if (value[Symbol.iterator])
      value = [...value]
  
    if (value[Symbol.asyncIterator])
      value = await Promise.all(value)
  }

  const jsType = Array.isArray(value) ? 'array' : typeof value

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
        const metadata = value.constructor[toPojoSymbol]
        const keys = Object.keys(metadata ? metadata : value) 

        const result = { }
        for (const key of keys) {
          let type = metadata 
            ? metadata[key] // missing metadata; skip
            : null // no metadata; copy everything
          
          if (type === undefined)
            continue
      
          const entry = value[key]
          const entryValue = typeof entry == 'function' ? await entry.call(value) : entry
          result[key] = await toPojo(entryValue, type)
        }
        return result
      }

      case 'array':
        return await iterableToPojo(value)
    
      default:
        throw new Error(`unexpected type: ${jsType}`)
    }
  }

  switch (type) {
    case 'number':
      if (jsType != type && jsType != 'bigint')
        throw new Error(`Pojo number type must be typeof number or bigint; got ${jsType}`)
      return toPojo(value)

    case 'string':
      if (jsType != type)
        throw new Error(`Pojo string type must be typeof string; got ${jsType}`)
      return toPojo(value)
      
    case 'boolean':
      if (jsType != type)
        throw new Error(`Pojo boolean type must be typeof boolean; got ${jsType}`)
      return toPojo(value)

    case 'any':
      if (jsType == 'function')
        throw new Error(`Pojo any type must not be typeof function`)
      return toPojo(value)

    case 'list': {
      if (jsType != 'array')
        throw new Error(`Pojo list type must be typeof array; got ${jsType}`)
      const list = []
      for (const item of value) {
        list.push(await toPojo(item))
      }
      return list
    }
    
    case 'infos': {
      const infos = await toPojo(value, 'list')
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

export {
  toPojo,
  toPojoSymbol,
}