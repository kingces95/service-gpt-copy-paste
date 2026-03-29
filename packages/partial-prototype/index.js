import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { Es6Prototype, Es6PrototypeCache } from '@kingjs/es6-prototype'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialTypeReflect } from '@kingjs/partial-type'

export function getPrototype(type) {
  assert(PartialTypeReflect.isPartialType(type))
  if (PartialLoader.transparent(type)) 
    return createPrototype(type)

  return cache.getPrototype(type)
}

function createPrototype(partialType) {
  return PartialLoader.hierarchy(partialType)
    .reduce((prototype, partialType) => {
      const descriptors = { }

      let ownKey
      for (const current of PartialLoader.ownDescriptors(partialType)) {
        assert(typeof current == 'object'
          || typeof current == 'string' 
          || typeof current == 'symbol',
          `Unexpected type: ${typeof current}`)

        switch (typeof current) {
          case 'string':
          case 'symbol':
            ownKey = current 
          break
          case 'object':
            // inherit existing descriptor if current is abstract
            if (isAbstract(current)) {
              const existing = descriptors[ownKey]
              if (existing && !isAbstract(existing))
                current = existing
            }
            descriptors[ownKey] = current
            break
        }
      }
      return Es6Prototype.createLink(partialType, prototype, descriptors)
    }, null)
}

const cache = new Es6PrototypeCache(partialType => {
  return createPrototype(partialType)
})