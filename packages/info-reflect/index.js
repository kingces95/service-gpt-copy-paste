import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept } from "@kingjs/concept"

export class InfoReflect {
  
  static *concepts(type) {
    for (const current of PartialReflect.baseTypes(type)) {
      if (!PartialReflect.isExtensionOf(current, Concept)) continue
      yield current
    }
  }

  // Es6Reflect proxies
  static getMetadata(type) {
    return Metadata.get(type)
  }
}

export class GetterMd {
  static Type = 'getter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class SetterMd { 
  static Type = 'setter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class PropertyMd { 
  static Type = 'property'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class FieldMd { 
  static Type = 'field'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = true
}
export class MethodMd { 
  static Type = 'method'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = false
}
export class ConstructorMd { 
  static Type = 'constructor'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = false
}
export class PrototypeMd { 
  static Type = 'prototype'
  static DefaultConfigurable = false
  static DefaultWritable = false
  static DefaultEnumerable = false
}

const Metadata = new Map([
  [FieldMd.Type, FieldMd],
  [MethodMd.Type, MethodMd],
  [GetterMd.Type, GetterMd],
  [SetterMd.Type, SetterMd],
  [PropertyMd.Type, PropertyMd],
  [ConstructorMd.Type, ConstructorMd],
  [PrototypeMd.Type, PrototypeMd],
])