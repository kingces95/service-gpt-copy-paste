import { isTrimable } from "@kingjs/pojo-trim"

async function getOrCall(target, name) {
  const functionOrValue = target[name]
  return await (typeof functionOrValue == 'function' 
    ? functionOrValue.call(target) 
    : functionOrValue)
}

export async function toPojo(value, options = { }) {
  const { type = null, symbol, depth, path = [] } = options
  const jsType = typeof value

  if (value === null || value === undefined)
    return
  
  if (!type) {
    if (Array.isArray(value))
      return await toPojo(value, { symbol, type: 'list', depth, path })
  
    switch (jsType) {
      case 'symbol':
      case 'function':
        return

      case 'boolean':
        if (!value) return

      case 'number':
      case 'bigint':
      case 'string':
        return value
        
      case 'object': {
        const metadata = value.constructor?.[symbol]
        const isPojo = Object.getPrototypeOf(value) === Object.prototype

        // if there is no metadata, then ignore unless it is a plain object.
        // if (!metadata && !isPojo)
        //   throw new Error(`Object must be pojo or have metadata`)

        // if there is no metadata, then transform all properties to pojos.
        if (!metadata) {
          if (!isPojo) {
            const className = value.constructor?.name
            return `[type: ${className}, toString: ${value.toString()}]`
          }

          const result = { }
          for (const key in value) {
            const pojo = await toPojo(value[key], { symbol, depth, path: [...path, key] })
            if (pojo === undefined) continue
            result[key] = pojo 
          }
          if (isTrimable(result))
            return
          return result
        } 

        // stop recursing if depth is zero and object can be referenced
        const ref = value[metadata[symbol]]
        if (!depth && ref)
          return ref

        // decrement depth if value could be referenced
        let newDepth = depth - (ref ? 1 : 0)
        
        // if metadata is a string, return the value of the property
        if (typeof metadata == 'string') {
          return await toPojo(await getOrCall(value, metadata), { 
            symbol, depth: newDepth, path: [...path, metadata]
          })
        }

        // if metadata is an object, then transform properties with metadata.
        const result = { }
        for (const key in metadata) {
          let type = metadata[key]
          const keyValue = await getOrCall(value, key)
          const pojo = await toPojo(keyValue, { 
            type, symbol, depth: newDepth, path: [...path, key]
          })
          if (pojo === undefined) continue
          result[key] = pojo
        }
        if (isTrimable(result))
          return
        return result
      }

      case 'array':
        const array = []
        for (const item of value) {
          array.push(await toPojo(item), { symbol, depth, path })
        }
        if (!array.length)
          return
        return array
    
      default:
        throw new Error(`unexpected type: ${jsType}`)
    }
  }

  switch (type) {
    case 'number':
      if (jsType != type && jsType != 'bigint')
        throw new Error(`Pojo number type must be typeof number or bigint; got ${jsType}`)
      return await value

    case 'string':
      if (jsType != type)
        throw new Error(`Pojo string type must be typeof string; got ${jsType}`)
      return await value
      
    case 'boolean':
      if ('boolean' != type)
        throw new Error(`Pojo boolean type must be typeof boolean; got ${jsType}`)
      var predicate = await value
      if (!predicate)
        return
      return predicate

    case 'url':
      if (value && !(value instanceof URL))
        throw new Error(`Pojo url type must be instanceof URL`)
      return await toPojo(value?.toString(), { symbol, depth, path })

    case 'any':
      if (jsType == 'function')
        throw new Error(`Pojo any type must not be typeof function`)
      return await toPojo(value, { symbol, depth, path })

    case 'list': {
      if (jsType != 'object')
        throw new Error(`Pojo list type must be typeof object; got ${jsType}`)

      const list = []
      for await (const item of value) {
        list.push(await toPojo(item, { symbol, depth, path }))
      }
      if (!list.length)
        return
      return await Promise.all(list)
    }

    case 'entries': {
      const entries = await toPojo(value, { symbol, type: 'list', depth, path })
      if (!entries) return
      return Object.fromEntries(entries)
    }

    case 'infos': {
      const infos = await toPojo(value, { symbol, type: 'list', depth, path })
      if (!infos) return
      const entries = []
      for (const info of infos) {
        if (!Object.hasOwn(info, 'name')) 
          throw new Error(`Pojo info object must have a name property`)
      
        const name = info.name
        delete info.name
        
        entries.push([name, info])
      }
      const result = Object.fromEntries(entries)
      if (isTrimable(result)) return
      return result
    }

    default:
      throw new Error(`Unexpected pojo type: ${type}`)
  }
}
