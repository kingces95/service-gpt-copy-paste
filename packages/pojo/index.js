import assert from 'assert'
import { isTrimable } from "@kingjs/pojo-trim"
import { pivotPojos } from "@kingjs/pojo-pivot"
import { siftPojos } from "@kingjs/pojo-sift"

async function getOrCall(target, name) {
  const functionOrValue = target[name]
  return await (typeof functionOrValue == 'function' 
    ? functionOrValue.apply(target) 
    : functionOrValue)
}

export async function toPojo(value, options = { }) {
  const { 
    type = null, 
    symbol, metadata,
    depth = 1, 
    path = [], 
    context = [],
    filter, 
    pivot,
  } = options
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

        const valueMd = value.constructor?.[symbol]
          ?? metadata?.get(value.constructor)
        assert(valueMd != null, 
          `failed to find pojo metadata ctor: ${value.constructor?.name} `)
        const isPojo = Object.getPrototypeOf(value) === Object.prototype

        // if there is no metadata, then ignore unless it is a plain object.
        if (!valueMd && !isPojo) {
          return
        }

        // if there is no metadata, then transform all properties to pojos.
        if (!valueMd) {
          const result = { }
          for (const key in value) {
            const pojo = await toPojo(value[key], { ...options, path: [...path, key] })
            if (pojo === undefined) continue
            result[key] = pojo 
          }
          if (isTrimable(result))
            return
          return result
        } 

        // stop recursing if depth is zero and object can be referenced
        const ref = value[valueMd[symbol]]
        if (!depth && ref)
          return ref

        // decrement depth if value could be referenced
        let newDepth = depth - (ref ? 1 : 0)
        
        // if metadata is a string, return the value of the property
        if (typeof valueMd == 'string') {
          return await toPojo(await getOrCall(value, valueMd), { 
            ...options, path: [...path, valueMd], 
              depth: newDepth, context: [...context, result]
          })
        }

        // if metadata is an object, then transform properties with metadata.
        const result = { }
        for (const key in valueMd) {
          let type = valueMd[key]
          if (type == 'type') { result[key] = value.constructor.name; continue }
          const keyValue = await getOrCall(value, key)
          const pojo = await toPojo(keyValue, { 
            ...options, type, path: [...path, key], 
              depth: newDepth, context: [...context, result]
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

  if (typeof type == 'function') {
    return await type(value, context)
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
      
    case true:
    case false:
    case 'naeloob': 
    case 'boolean': 
      if (jsType != 'boolean') throw new Error(
        `Pojo boolean type must be typeof boolean; got ${jsType}`)
      var predicate = await value
      var default$ = (type == 'boolean' || type === false) ? false : true
      return predicate === default$ ? undefined : predicate

    case 'url':
      if (value && !(value instanceof URL)) throw new Error(
        `Pojo url type must be instanceof URL`)
      return await toPojo(value?.toString(), { ...options, type: null })

    case 'ref':
    case 'any':
      if (jsType == 'function') throw new Error(
        `Pojo any type must not be typeof function`)
      return await toPojo(value, { ...options, type: null })

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
        list.push(await toPojo(functor, { ...options, type: null }))
      }
      if (!list.length)
        return
      return list
    }

    case 'tokens':
      const list = []
      for await (const item of value)
        list.push(item)
      return list.join(' ')     

    case 'records':
      // use options.filter to filter records if provided
    case 'names':
    case 'refs':
    case 'list': {
      const listType = type == 'names' ? 'name' : null

      if (jsType != 'object') throw new Error(
        `Pojo list type must be typeof object; got ${jsType}`)

      const list = []
      for await (const item of value) {
        const element = await toPojo(item, { ...options, type: listType })
        assert(element)
        list.push(element)
      }
      if (!list.length)
        return

      let result = await Promise.all(list)

      if (type == 'records') {
        if (filter) result = [...siftPojos(result, filter)]
        if (pivot) result = pivotPojos(result, pivot, context)
      }

      return result
    }

    case 'entries': {
      const entries = await toPojo(value, { ...options, type: 'list' })
      if (!entries) return
      return Object.fromEntries(entries)
    }

    case 'infos': {
      const infos = await toPojo(value, { ...options, type: 'list' })
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
