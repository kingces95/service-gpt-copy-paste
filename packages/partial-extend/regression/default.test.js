import { describe, it, expect } from 'vitest'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  Defaults,
  Preconditions,
  Transforms,
} from '@kingjs/partial-proxy'
import { extend } from '@kingjs/partial-extend'
import { PartialClass } from '@kingjs/partial-class'
import { defaultTo } from '@kingjs/function-args'
import { contract } from '@kingjs/function-contract'

const DefaultsMetadata = [
  undefined,
  defaultTo(({ args: [first] }) => first),
]

class BasePart extends PartialClass {
  static [Defaults] = {
    member: DefaultsMetadata,
  }

  member(first, second = first) {
    this.push(`member:${first}:${second}`)
  }
}

class PreconditionPart extends BasePart {
  static [Preconditions] = {
    member(first, second) {
      this.push(`precondition:${first}:${second}`)
    },
  }
}

function transformSecond(value) {
  this.push(`transform:${value}`)
  return value
}

class TransformPart extends BasePart {
  static [Transforms] = {
    member: [null, transformSecond],
  }

  member(first, second) {
    this.push(`member:${first}:${second}`)
  }
}

class PreconditionType extends PartialProxy {
  constructor() {
    super()
    this.calls = []
  }

  push(value) {
    this.calls.push(value)
  }

  static {
    extend(this, PreconditionPart)
  }
}

class TransformType {
  constructor() {
    this.calls = []
  }

  push(value) {
    this.calls.push(value)
  }

  static {
    extend(this, TransformPart)
  }
}

class ExtendedTransformPart extends PartialClass {
  static {
    extend(this, TransformPart)
  }
}

class ExtendedTransformType {
  constructor() {
    this.calls = []
  }

  push(value) {
    this.calls.push(value)
  }

  static {
    extend(this, ExtendedTransformPart)
  }
}

class ContractType {
  constructor() {
    this.calls = []
  }

  push(value) {
    this.calls.push(value)
  }

  static {
    extend(this, BasePart)
    this.prototype.member = contract({
      defaults: DefaultsMetadata,
      transforms: [null, transformSecond],
    }, function member(first, second = first) {
      this.push(`member:${first}:${second}`)
    })
  }
}

describe('Defaulted partial members', () => {
  it('passes inherited declarative defaults to proxy preconditions', () => {
    const instance = new PreconditionType()

    instance.member('value')

    expect(instance.calls).toEqual([
      'precondition:value:value',
      'member:value:value',
    ])
  })

  it('passes inherited declarative defaults to loader-injected transforms', () => {
    const instance = new TransformType()

    instance.member('value')

    expect(instance.calls).toEqual([
      'transform:value',
      'member:value:value',
    ])
  })

  it('does not double-wrap inherited loader-injected transforms', () => {
    const instance = new ExtendedTransformType()

    instance.member('value')

    expect(instance.calls).toEqual([
      'transform:value',
      'member:value:value',
    ])
  })

  it('passes procedural contract defaults to procedural transforms', () => {
    const instance = new ContractType()

    instance.member('value')

    expect(instance.calls).toEqual([
      'transform:value',
      'member:value:value',
    ])
  })
})
