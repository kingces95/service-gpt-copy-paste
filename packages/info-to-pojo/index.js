import {
  FunctionInfo,
  MemberInfo,
} from '@kingjs/info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { dumpPojo } from "@kingjs/pojo-dump"
import { PojoMetadata } from '@kingjs/pojo-metadata'
import { isAbstract } from '@kingjs/abstract'

function metadata({ ownOnly } = { }) {
  return new PojoMetadata([
    [FunctionInfo, {
      name: 'string',
      base: 'name',
      isAnonymous: 'boolean',
      [ownOnly ? 'ownMembers' : 'members']: 'records',
    }],
    [MemberInfo, {
      name: 'key',
      modifiers: 'list',
      isAbstract: 'boolean',
      host: ({ name }, [ context ]) => 
        name == context.name ? '.' : name,

      // pivots
      type: 'string',
      isStatic: 'boolean',
      isKnown: 'boolean',
      isNonPublic: 'boolean',
      isConceptual: 'boolean',
      concepts: 'names',
    }],
  ])
}

const typePivotMd = {
  constructor: { discriminator: 'constructor' },
  methods: { discriminator: 'method' },
  getters: { discriminator: 'getter' },
  setters: { discriminator: 'setter' },
  properties: { discriminator: 'property' },
  fields: { discriminator: 'field' },
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
const conceptualPivotMd = {
  conceptual: {
    predicate: 'isConceptual',
    copyPivot: [ 'concepts', typePivotMd ],
  },
  ...staticPivotMd
}

FunctionInfo.prototype.toPojo = async function({ filter, ownOnly } = { }) {
  const pojo = await toPojo(this, { 
    filter,
    pivot: conceptualPivotMd,
    metadata: metadata({ ownOnly }),
  })

  const trimmedPojo = trimPojo(pojo)
  return trimmedPojo
}
FunctionInfo.prototype.dump = async function(options = { }) {
  const pojo = await this.toPojo(options)
  dumpPojo(pojo)
}
