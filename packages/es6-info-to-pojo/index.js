import {
  //Es6Info,
  Es6ClassInfo,
  Es6MemberInfo,
  Es6ValueMemberInfo,
  Es6DataMemberInfo,
  Es6MethodMemberInfo,
  //Es6ConstructorMemberInfo,
  Es6AccessorMemberInfo,
} from '@kingjs/es6-info'

import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { dumpPojo } from "@kingjs/pojo-dump"

const symbol = Symbol('es6-info-to-pojo')

Es6ClassInfo[symbol] = {
  name: 'string',
  base: 'name',
  records: 'records',
  toString: 'string',
}

Es6MemberInfo[symbol] = {
  name: 'key',
  type: 'string',
  
  host: 'name',
  isStatic: 'boolean',
  isKnown: 'boolean',
  isNonPublic: 'boolean',

  isConfigurable: 'naeloob',

  hasGetter: 'boolean',
  hasSetter: 'boolean',
  // hasValue: 'boolean',
  // parent: 'name',
  rootHost: 'name',
}

Es6ValueMemberInfo[symbol] = {
  ...Es6MemberInfo[symbol],
  isWritable: 'naeloob',
}

Es6MethodMemberInfo[symbol] = {
  ...Es6ValueMemberInfo[symbol],
  isEnumerable: 'boolean',
}

Es6DataMemberInfo[symbol] = {
  ...Es6ValueMemberInfo[symbol],
  isEnumerable: 'naeloob',
}

Es6AccessorMemberInfo[symbol] = {
  ...Es6MemberInfo[symbol],
  isEnumerable: 'boolean',
}

const typePivotMd = {
  methods: { type: 'method' },
  data: { type: 'data' },
  accessors: { type: 'accessor' },      
}
const nonPublicPivotMd = {
  __nonPublic: {
    predicate: 'isNonPublic', 
    pivot: typePivotMd,
  },
  ...typePivotMd
}
const knownPivotMd = {
  __known: { 
    predicate: 'isKnown', 
    pivot: nonPublicPivotMd,
  },
  ...nonPublicPivotMd
}
const staticPivotMd = {
  static: {
    predicate: 'isStatic', 
    pivot: knownPivotMd,
  },
  instance: {
    pivot: knownPivotMd
  }
}

Es6ClassInfo.prototype.records = function*(filter) {
  const { includeInhertied = true } = filter || { }

  if (includeInhertied) {
    yield* Es6ClassInfo.members(this)
    yield* Es6ClassInfo.members(this, { isStatic: true })
  } else {
    yield* this.ownMembers()
    yield* this.ownMembers({ isStatic: true })
  }
}
Es6ClassInfo.prototype.toPojo = async function({ filter } = { }) {
  const pojo = await toPojo(this, { 
    symbol,
    filter,
    pivot: staticPivotMd,
  })

  const trimmedPojo = trimPojo(pojo)
  return trimmedPojo
}
Es6ClassInfo.prototype.dump = async function(options = { }) {
  const pojo = await this.toPojo(options)
  dumpPojo(pojo)
}

// export function filterInfoPojo(pojo, { 
//   includeStatic = false,
//   includeInstance = false
// } = {
//   includeStatic: {
//     isNonPublic: false,
//     isKnown: false,
//     isSymbol: false,
//     isInherited: false,
//   },
//   includeInstance: {
//     isNonPublic: false,
//     isKnown: false,
//     isSymbol: false,
//     isInherited: false,
//   }
// }) {
//   const result = { }

//   if (pojo.name) result.name = pojo.name
//   if (pojo.base) result.base = pojo.base

//   function filter(name, member, { 
//     isNonPublic, isKnown, isSymbol, isInherited }) {

//     if (!isNonPublic && member.isNonPublic) return false
//     if (!isKnown && member.isKnown) return false
//     if (!isSymbol && typeof name == 'symbol') return false
//     if (!isInherited && (member.host != pojo.name)) return false
//     return true
//   }

//   const allMembers = [...pojo.__records ?? []]
//     .filter(member => {
//       if (typeof includeStatic == 'boolean' && member.isStatic)
//         return includeStatic
//       if (typeof includeInstance == 'boolean' && !member.isStatic)
//         return includeInstance
//       return filter(member.name, member,
//         member.isStatic ? includeStatic : includeInstance)
//     })

//   result.members = pivotPojos(allMembers, staticPivotMd)
//   return trimPojo(result)
// }
