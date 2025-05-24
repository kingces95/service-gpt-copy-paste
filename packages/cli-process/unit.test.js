import { CliProcess } from './index.js'
import { Path } from '@kingjs/path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toBeEquals } from '@kingjs/vitest'

expect.extend({ toBeEquals })

describe('A cli process', () => {
  describe('signal', () => {
    it('should be a property.', () => {
      const signal = CliProcess.signal
      expect(signal).toBeDefined()
    })
    it('should return null by default.', () => {
      const signal = CliProcess.signal
      expect(signal).toBeNull()
    })
    it('can be established with a signal', async () => {
      const expected = new AbortController().signal
      await CliProcess.create({ signal: expected }, () => {
        const actual = CliProcess.signal
        expect(actual).toBe(expected)
      })
    })
  })
  describe('environment', () => {
    it('should be a property.', () => {
      const env = CliProcess.env
      expect(env).toBeDefined()
    })
    it('should return process.env by default.', () => {
      const env = CliProcess.env
      expect(env).toBe(process.env)
    })
    it('can be established with an object', async () => {
      const env = { FOO: 'bar' }
      await CliProcess.create({ env }, () => {
        const actual = CliProcess.env
        expect(actual).toBe(env)
      })
    })
  })
  describe('working directory', () => {
    it('should be a function.', () => {
      const cwd = CliProcess.cwd
      expect(cwd).toBeDefined()
      expect(cwd).toBeInstanceOf(Function)
    })
    it('should return a Path.', () => {
      const cwd = CliProcess.cwd()
      expect(cwd).toBeInstanceOf(Path)
    })
    it('should return a Path equals to process.cwd() by default.', () => {
      const expected = Path.create(process.cwd())
      const actual = CliProcess.cwd()
      expect(actual).toBeEquals(expected)
    })
    it('can be established with a function', async () => {
      const expected = Path.create('/foo/bar')
      await CliProcess.create({ cwdFn: () => expected }, () => {
        const actual = CliProcess.cwd()
        expect(actual).toBeEquals(expected)
      })
    })
  })
  describe('create', () => {
    it('should be a function.', () => {
      const create = CliProcess.create
      expect(create).toBeDefined()
      expect(create).toBeInstanceOf(Function)
    })
    it('should return a Promise.', () => {
      const promise = CliProcess.create({}, () => { })
      expect(promise).toBeDefined()
      expect(promise).toBeInstanceOf(Promise)
    })
    it('can establish a frame with an environment and cwd function.', async () => {
      const env = { FOO: 'bar' }
      const expected = Path.create('/foo/bar')
      await CliProcess.create({ env, cwdFn: () => expected }, () => {
        const actualEnv = CliProcess.env
        expect(actualEnv).toBe(env)
        const actualCwd = CliProcess.cwd()
        expect(actualCwd).toBeEquals(expected)
      })
    })
  })
})