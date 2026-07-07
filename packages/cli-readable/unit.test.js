import { describe, it, expect } from 'vitest'
import { mkdtemp, open, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  CliReadable,
  DEV_NULL,
} from './index.js'

async function read(readable) {
  const chunks = []

  for await (const chunk of readable)
    chunks.push(chunk)

  return Buffer.concat(chunks).toString()
}

describe('A cli readable', () => {
  it('should read a string.', async () => {
    const readable = CliReadable.from('hello world')
    const result = await read(readable)

    expect(result).toBe('hello world')
    expect(readable.count).toBe(Buffer.byteLength('hello world'))
  })
  it('should read a buffer.', async () => {
    const readable = CliReadable.from(Buffer.from('hello world'))
    const result = await read(readable)

    expect(result).toBe('hello world')
    expect(readable.count).toBe(Buffer.byteLength('hello world'))
  })
  it('should read a generator.', async () => {
    const readable = CliReadable.from(function* () {
      yield 'hello'
      yield ' '
      yield 'world'
    })
    const result = await read(readable)

    expect(result).toBe('hello world')
    expect(readable.count).toBe(Buffer.byteLength('hello world'))
  })
  it('should read an async generator.', async () => {
    const readable = CliReadable.from(async function* () {
      yield 'hello'
      yield ' '
      yield 'world'
    })
    const result = await read(readable)

    expect(result).toBe('hello world')
    expect(readable.count).toBe(Buffer.byteLength('hello world'))
  })
  it('should read a file path.', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cli-readable-'))
    const path = join(dir, 'input.txt')

    await writeFile(path, 'hello world')
    try {
      const readable = await CliReadable.fromPath(path)
      const result = await read(readable)

      expect(result).toBe('hello world')
      expect(readable.count).toBe(Buffer.byteLength('hello world'))
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
  it('should read a dev fd path.', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cli-readable-'))
    const path = join(dir, 'input.txt')
    let fileHandle

    await writeFile(path, 'hello world')
    try {
      fileHandle = await open(path, 'r')
      const readable = await CliReadable.fromPath(`/dev/fd/${fileHandle.fd}`)
      const result = await read(readable)

      expect(result).toBe('hello world')
      expect(readable.count).toBe(Buffer.byteLength('hello world'))
    } finally {
      await fileHandle?.close()
      await rm(dir, { recursive: true, force: true })
    }
  })
  it('should read dev null as an empty stream.', async () => {
    const readable = await CliReadable.fromPath(DEV_NULL)
    const result = await read(readable)

    expect(result).toBe('')
    expect(readable.count).toBe(0)
  })
})
