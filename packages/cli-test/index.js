import { Readable, PassThrough } from 'stream'
import { describe, it, expect, beforeEach } from 'vitest'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import path from 'path'

export async function compareStreams(actualStream, expectedStringOrStream) {
  // Normalize expected to a stream
  const expectedStream = typeof expectedStringOrStream === 'string'
    ? Readable.from([expectedStringOrStream])
    : expectedStringOrStream

  const readToString = async (stream) => {
    let result = ''
    for await (const chunk of stream) {
      result += chunk.toString()
      continue
    }
    return result
  }

  const actualResult = await readToString(actualStream)
  const expectedResult = await readToString(expectedStream)
  expect(actualResult).toBe(expectedResult)
}

export class CliVitestPaths {
  #meta

  constructor(meta) {
    this.#meta = meta
  }

  get meta() { return this.#meta }
  get url() { return this.meta.url }
  get fileName() { return fileURLToPath(this.url) }
  get rootDir() { return dirname(this.fileName) }
}

export class CliVitestPojo {
  #paths
  constructor(paths) {
    this.#paths = paths
  }

  get pojoExt() { return 'pojo' }
  get pojoDir() { return path.join(this.#paths.rootDir, 'pojo') }

  expect(target, fileName) {
    const filePath = path.join(this.pojoDir, fileName + '.' + this.pojoExt)
    const pojo = target.__toPojo()
    const dump = dumpPojo(pojo)
    const expected = Readable.from([filePath])
    return compareStreams(target, expected)
  }
}