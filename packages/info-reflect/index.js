import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject } from '@kingjs/partial-object'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { Concept, ConceptReflect } from "@kingjs/concept"
import { PartialClass, PartialClassReflect } from '@kingjs/partial-class'
import { UserReflect } from '@kingjs/user-reflect'
import { Es6Associate } from '@kingjs/es6-associate'

export class InfoReflect {

  static isKnown(type) { 
    if (!type) return false
    if (Es6Reflect.isKnown(type)) return true
    if (type == PartialObject) return true
    if (type == PartialPojo) return true
    if (type == PartialClass) return true
    if (type == Concept) return true
    return false
  }

  static *ownPartialObjects(type) {
    if (PartialReflect.isPartialObject(type))
      return yield* PartialReflect.ownPartialObjects(type)

    yield* Es6Associate.ownTypes(
      type, { [PartialReflect.Declarations]: { } })
  }
  static *partialObjects(type) {
    if (PartialReflect.isPartialObject(type))
      return yield* PartialReflect.partialObjects(type)

    yield* Es6Associate.types(
      type, { [PartialReflect.Declarations]: { } })
  }

  static *ownKeys(type, { isStatic } = { }) { 
    if (this.isKnown(type)) return
   
    if (PartialReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialReflect.ownKeys(type)
    }

    yield* UserReflect.ownKeys(type, { isStatic })
  }
  static *keys(type, { isStatic } = { }) {
    if (this.isKnown(type)) return
   
    if (PartialReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialReflect.keys(type)
    }

    yield* UserReflect.keys(type, { isStatic })
  }

  static getOwnDescriptor(type, key, { isStatic } = { }) { 
    if (this.isKnown(type)) return
   
    if (PartialReflect.isPartialObject(type)) {
      if (isStatic) return
      return PartialReflect.getOwnDescriptor(type, key)
    }

    return UserReflect.getOwnDescriptor(type, key, { isStatic })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    if (this.isKnown(type)) return

    if (PartialReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialReflect.ownDescriptors(type)
    }

    yield* UserReflect.ownDescriptors(type, { isStatic })
  }

  static *getDescriptor(type, key, { isStatic } = { }) { 
    if (this.isKnown(type)) return
  
    if (PartialReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialReflect.getDescriptor(type, key)
    }

    yield* UserReflect.getDescriptor(type, key, { isStatic })
  }
  static *descriptors(type, { isStatic } = { }) { 
    if (this.isKnown(type)) return

    if (PartialReflect.isPartialObject(type)) {
      if (isStatic) return
      return yield* PartialReflect.descriptors(type)
    }

    yield* UserReflect.descriptors(type, { isStatic })
  }

  static typeof(type, key, descriptor, { isStatic } = { }) {
    return Es6Reflect.typeof(type, key, descriptor, { isStatic })
  }
  static getMetadata(type) {
    return Es6Reflect.getMetadata(type)
  }

  static *ownPartialClasses(type) {
    yield* PartialClassReflect.ownPartialClasses(type)
  }
  static *partialClasses(type) {
    yield* PartialClassReflect.partialClasses(type)
  }
  static getPartialClass(type, name) {
    return PartialClassReflect.getPartialClass(type, name)
  }

  static *concepts(type) {
    yield *ConceptReflect.concepts(type)
  }
  static *ownConcepts(type) {
    yield *ConceptReflect.ownConcepts(type)
  }
  static *getConceptHosts(type, name) {
    yield *ConceptReflect.getConceptHosts(type, name)
  }
  static *associatedConcepts(type) {
    yield* ConceptReflect.ownAssociatedConcepts(type)
  }
  static *ownAssociatedConcepts(type) {
    yield* ConceptReflect.ownAssociatedConcepts(type)
  }
}