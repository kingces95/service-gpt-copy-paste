import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject } from '@kingjs/partial-object'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { Concept } from "@kingjs/concept"
import { PartialClass } from '@kingjs/partial-class'
import { UserReflect } from '@kingjs/user-reflect'

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

  static *ownKeys(type, { isStatic } = { }) { 
    if (this.isKnown(type)) return
   
    if (PartialReflect.isPartialObject(type))
      yield* PartialReflect.ownKeys(type, { isStatic })
    else 
      yield* UserReflect.ownKeys(type, { isStatic })
  }
  static *keys(type, { isStatic } = { }) {
    if (this.isKnown(type)) return
   
    if (PartialReflect.isPartialObject(type))
      yield* PartialReflect.keys(type, { isStatic })
    else 
      yield* UserReflect.keys(type, { isStatic })
  }

  static getOwnDescriptor(type, key, { isStatic } = { }) { 
    if (this.isKnown(type)) return
   
    if (PartialReflect.isPartialObject(type)) 
      return PartialReflect.getOwnDescriptor(type, key, { isStatic })
    else
      return UserReflect.getOwnDescriptor(type, key, { isStatic })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    if (this.isKnown(type)) return

    if (PartialReflect.isPartialObject(type))
      yield* PartialReflect.ownDescriptors(type, { isStatic })
    else
      yield* UserReflect.ownDescriptors(type, { isStatic })
  }

  static *getDescriptor(type, key, { isStatic } = { }) { 
    if (this.isKnown(type)) return
  
    if (PartialReflect.isPartialObject(type))
      yield* PartialReflect.getDescriptor(type, key, { isStatic })
    else
      yield* UserReflect.getDescriptor(type, key, { isStatic })
  }
  static *descriptors(type, { isStatic } = { }) { 
    if (this.isKnown(type)) return

    if (PartialReflect.isPartialObject(type))
      yield* PartialReflect.descriptors(type, { isStatic })
    else
      yield* UserReflect.descriptors(type, { isStatic })
  }
}