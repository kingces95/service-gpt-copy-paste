import { describe, it, expect } from 'vitest'
import { TempPath } from './index.js'
import { Path } from '@kingjs/path'
import { Disposer } from '@kingjs/disposer'

const NAME_RX = /^tmp-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('static', () => {
  describe('create', () => {
    it('should create a unique Path in the OS temp dir.', async () => {
      const path = TempPath.create()
      expect(path).toBeInstanceOf(Path)
      expect(path.parent.value).toBe(process.env.TEMP || process.env.TMPDIR)
      expect(path.name).toMatch(NAME_RX)
      expect(await path.exists()).toBe(false)
    })
  })
  describe('createFile', () => {
    it('should create a unique file in the OS temp dir.', async () => {
      const [path, disposer] = await TempPath.createFile()
      expect(path).toBeInstanceOf(Path)
      expect(disposer).toBeInstanceOf(Disposer)
      expect(path.parent.value).toBe(process.env.TEMP || process.env.TMPDIR)
      expect(path.name).toMatch(NAME_RX)
      expect(await path.exists()).toBe(true)
      expect(await path.read()).toBe('')
      await disposer.dispose()
      expect(await path.exists()).toBe(false)
    })
  })
  describe('createDir', () => {
    it('should create a unique directory in the OS temp dir.', async () => {
      const [path, disposer] = await TempPath.createDir()
      expect(path).toBeInstanceOf(Path)
      expect(disposer).toBeInstanceOf(Disposer)
      expect(path.parent.value).toBe(process.env.TEMP || process.env.TMPDIR)
      expect(path.name).toMatch(NAME_RX)
      expect(await path.exists()).toBe(true)
      await disposer.dispose()
      expect(await path.exists()).toBe(false)
    })
    it('should recursively delete the directory.', async () => {
      const [path, disposer] = await TempPath.createDir()
      const nestedDir = await path('foo')('bar').make()
      expect(await nestedDir.exists()).toBe(true)
      expect(await path.exists()).toBe(true)
      await disposer.dispose()
      expect(await path.exists()).toBe(false)
      expect(await nestedDir.exists()).toBe(false)
    })
    it('should not throw if the directory does not exist.', async () => {
      const [path, disposer] = await TempPath.createDir()
      expect(await path.exists()).toBe(true)
      await path.remove()
      expect(await path.exists()).toBe(false)
      await disposer.dispose()
    })
  })
})

