import { describe, it, expect } from 'vitest'
import {
  applyDefaults,
  applyTransforms,
  defaultTo,
  transform,
} from '@kingjs/function-args'

describe('function args', () => {
  it('applies procedural defaults left to right', () => {
    const args = applyDefaults([], [
      defaultTo(() => 1),
      defaultTo(({ args: [left] }) => left + 1),
    ])

    expect(args).toEqual([1, 2])
  })

  it('passes this to procedural defaults', () => {
    const context = { value: 1 }
    const args = applyDefaults([], [
      defaultTo(({ self }) => self.value),
    ], context)

    expect(args).toEqual([1])
  })

  it('preserves literal function defaults', () => {
    const defaultFn = () => 1
    const args = applyDefaults([], [
      defaultFn,
    ])

    expect(args).toEqual([defaultFn])
  })

  it('applies slot-local transforms', () => {
    function upper(value) { return value.toUpperCase() }
    const args = applyTransforms(['a', 'b'], [
      upper,
      null,
    ])

    expect(args).toEqual(['A', 'b'])
  })

  it('passes this to transforms', () => {
    function prefix(value) { return this.prefix + value }
    const context = { prefix: '>' }
    const args = applyTransforms(['a'], [
      prefix,
    ], context)

    expect(args).toEqual(['>a'])
  })

  it('wraps a function with transforms', () => {
    function upper(value) { return value.toUpperCase() }
    function identity(value) { return value }
    const transformed = transform(identity, [upper])

    expect(transformed('a')).toBe('A')
  })
})
