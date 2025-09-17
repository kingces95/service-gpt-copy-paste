import {
  Info,
  FunctionInfo,
  MemberInfo,
  ValueMemberInfo,
  AccessorMemberInfo,
  MethodMemberInfo,
  DataMemberInfo,
} from '@kingjs/info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { pivotPojos } from '@kingjs/pojo-pivot'

const symbol = Symbol('info-to-pojo')

FunctionInfo[symbol] = {
  name: 'string',
  base: 'name',
  //___members: 'any',
  //___staticMembers: 'any',
  //__members: 'infos',
  //__staticMembers: 'infos',
  __allMembers: 'any',
}

MemberInfo[symbol] = {
  name: 'key',
  type: 'string',
  isConceptual: 'boolean',
  concepts: 'names',
  //isConstructor: 'boolean',
  //isAccessor: 'boolean',
  //isMethod: 'boolean',
  //isData: 'boolean',  
  
  host: 'name',
  isStatic: 'boolean',
  isKnown: 'boolean',
  isNonPublic: 'boolean',

  isConfigurable: 'naeloob',

  isAbstract: 'boolean',
  hasGetter: 'boolean',
  hasSetter: 'boolean',
  // hasValue: 'boolean',
  // parent: 'name',
  rootHost: 'name',
}

ValueMemberInfo[symbol] = {
  ...MemberInfo[symbol],
  isWritable: 'naeloob',
}

MethodMemberInfo[symbol] = {
  ...ValueMemberInfo[symbol],
  isEnumerable: 'boolean',
}

DataMemberInfo[symbol] = {
  ...ValueMemberInfo[symbol],
  isEnumerable: 'naeloob',
}

AccessorMemberInfo[symbol] = {
  ...MemberInfo[symbol],
  isEnumerable: 'boolean',
}

export async function infoToPojo(info) {
  let pojo = await toPojo(info, { symbol })
  const result = trimPojo(pojo)
  return result
}

const typePivotMd = {
  methods: { type: 'method' },
  data: { type: 'data' },
  accessors: { type: 'accessor' },      
}
const conceptualPivotMd = {
  conceptual: { 
    predicate: 'isConceptual',
    //pivot: typePivotMd,
    copyPivot: [ 'concepts', typePivotMd ] 
  },
  ...typePivotMd
}
const nonPublicPivotMd = {
  __nonPublic: {
    predicate: 'isNonPublic', 
    pivot: conceptualPivotMd,
  },
  ...conceptualPivotMd
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

export function filterInfoPojo(pojo, { 
  includeStatic = false,
  includeInstance = false
} = {
  includeStatic: {
    isNonPublic: false,
    isKnown: false,
    isSymbol: false,
    isInherited: false,
  },
  includeInstance: {
    isNonPublic: false,
    isKnown: false,
    isSymbol: false,
    isInherited: false,
  }
}) {
  const result = { }

  if (pojo.name) result.name = pojo.name
  if (pojo.base) result.base = pojo.base

  function filter(name, member, { 
    isNonPublic, isKnown, isSymbol, isInherited }) {

    if (!isNonPublic && member.isNonPublic) return false
    if (!isKnown && member.isKnown) return false
    if (!isSymbol && typeof name == 'symbol') return false
    if (!isInherited && (member.type != pojo.name)) return false
    return true
  }

  const allMembers = [...pojo.__allMembers ?? []]
    .filter(member => {
      if (typeof includeStatic == 'boolean' && member.isStatic)
        return includeStatic
      if (typeof includeInstance == 'boolean' && !member.isStatic)
        return includeInstance
      return filter(member.name, member,
        member.isStatic ? includeStatic : includeInstance)
    })

  result.members = pivotPojos(allMembers, staticPivotMd)
  return trimPojo(result)
}
