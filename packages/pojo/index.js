import { isTrimable } from "@kingjs/pojo-trim"

async function getOrCall(target, name) {
  const functionOrValue = target[name]
  return await (typeof functionOrValue == 'function' 
    ? functionOrValue.call(target) 
    : functionOrValue)
}

export async function toPojo(value, options = { }) {
  const { type = null, symbol, depth = 1, path = [] } = options
  const jsType = typeof value

  if (value === null || value === undefined)
    return
  
  if (!type) {
    if (Array.isArray(value))
      return await toPojo(value, { ...options, type: 'list' })

    switch (jsType) {
      case 'symbol':
        return

      case 'boolean':
        return !value ? undefined : value

      case 'number':
      case 'bigint':
      case 'string':
        return value

      case 'function': // functor
      case 'object': {
        // iterators are treated as lists regardless of attached metadata.
        if (value[Symbol.iterator] || value[Symbol.asyncIterator])
          return await toPojo(value, { ...options, type: 'list' })

        const metadata = value.constructor?.[symbol]
        const isPojo = Object.getPrototypeOf(value) === Object.prototype

        // if there is no metadata, then ignore unless it is a plain object.
        if (!metadata && !isPojo) {
          return
        }

        // if there is no metadata, then transform all properties to pojos.
        if (!metadata) {
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
          if (type == 'type') { result[key] = value.constructor.name; continue }
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
    
      default:
        throw new Error(`unexpected type: ${jsType}`)
    }
  }

  switch (type) {
    case 'number':
      if (jsType != type && jsType != 'bigint') throw new Error(
        `Pojo number type must be typeof number or bigint; got ${jsType}`)
      return await value

    case 'key':
      if (jsType != 'string' && jsType != 'symbol') throw new Error(
        `Pojo string type must be typeof string or symbol; got ${jsType}`)
      return await value

    case 'string':
      if (jsType != type)
        throw new Error(`Pojo string type must be typeof string; got ${jsType}`)
      return await value
      
    case 'naeloob': 
    case 'boolean': 
      if (jsType != 'boolean') throw new Error(
        `Pojo boolean type must be typeof boolean; got ${jsType}`)
      var predicate = await value
      var default$ = type == 'boolean' ? false : true
      return predicate === default$ ? undefined : predicate

    case 'url':
      if (value && !(value instanceof URL)) throw new Error(
        `Pojo url type must be instanceof URL`)
      return await toPojo(value?.toString(), { symbol, depth, path })

    case 'ref':
    case 'any':
      if (jsType == 'function') throw new Error(
        `Pojo any type must not be typeof function`)
      return await toPojo(value, { symbol, depth, path })

    case 'name':
      if (jsType != 'object') throw new Error(
        `Pojo name type must be typeof object; got ${jsType}`)
      if (!'name' in value) throw new Error(
        `Pojo name type must have a name property`)
      return value.name

    case 'functors': {
      if (jsType != 'object') throw new Error(
        `Pojo list type must be typeof object; got ${jsType}`)

      const list = []
      for (const functor of value) {
        list.push(await toPojo(functor, { symbol, depth, path }))
      }
      if (!list.length)
        return
      return list
    }

    case 'refs':
    case 'list': {
      if (jsType != 'object') throw new Error(
        `Pojo list type must be typeof object; got ${jsType}`)

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
        if (!Object.hasOwn(info, 'name')) throw new Error(
          `Pojo info object must have a name property`)
      
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
