import { Readable, PassThrough } from 'stream'
import { describe, it, expect, beforeEach } from 'vitest'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { mkdir } from 'fs/promises'
import { 
  createWriteStream,
  createReadStream, 
  existsSync, 
} from 'fs'
import { formatPojo } from '@kingjs/pojo-format'
import path from 'path'

async function readToString(stream) {
  let result = ''
  for await (const chunk of stream) {
    result += chunk.toString()
    continue
  }
  return result
}

export async function compareStreams(actualStringOrStream, expectedStringOrStream) {
  const expectedStream = typeof expectedStringOrStream === 'string'
    ? Readable.from([expectedStringOrStream])
    : expectedStringOrStream
  const actualStream = typeof actualStringOrStream === 'string'
    ? Readable.from([actualStringOrStream])
    : actualStringOrStream

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
  #overwrite
  constructor(paths, { overwrite = false } = { }) {
    this.#paths = paths
    this.#overwrite = overwrite
  }

  get pojoExt() { return 'pojo' }
  get pojoDir() { return path.join(this.#paths.rootDir, 'pojo') }

  async expect(pojoOrObject, fileNameOrTask) {
    const fileName = typeof fileNameOrTask === 'string'
      ? fileNameOrTask
      : path.join(fileNameOrTask.suite.name, fileNameOrTask.name) 

    const pojo = typeof pojoOrObject.__toPojo === 'function' 
      ? await pojoOrObject.__toPojo() 
      : pojoOrObject

    const filePath = path.join(this.pojoDir, fileName + '.' + this.pojoExt)
    const actual = formatPojo(pojo)
    if (!existsSync(filePath) || this.#overwrite) {
      await mkdir(dirname(filePath), { recursive: true })
      const writable = createWriteStream(filePath)
      writable.write(actual)
      writable.end()
      return
    }

    const expected = createReadStream(filePath)
    return compareStreams(actual, expected)
  }
}