import { describe, it, expect, beforeEach } from 'vitest'
import { PassThrough } from 'stream'
import { CliShell } from '@kingjs/cli-shell'
import { Readable, PassThrough } from 'stream'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { unlink } from 'fs/promises'
import { once } from 'events'
import { compareStreams } from '@kingjs/cli-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const NODE = process.execPath
const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'

describe('Spawn', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('proc', async () => {
    const passThrough = new PassThrough()
    await $`${NODE} -e ${'process.stdout.write("hello world")'}`
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  it('proc-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n')
  })

  it('proc-proc-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`,
      $`${NODE} -e ${'console.log(require("fs").readFileSync(0,"utf8"))'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n\n')
  })
})

describe('Function', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('func', async () => {
    const passThrough = new PassThrough()
    await $(async $ => await $.stdout.write(HELLO_WORLD))
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  it('func-func', async () => {
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })
  
  it('func-func-func', async () => {
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      async $ => { 
        $.stdin.pipe($.stdout)
        await once($.stdin, 'end') 
      },
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })

  it('return-codes', async () => {
    const result = await $(
      async $ => { return 0 },
      async $ => { return 1 },
      async $ => { return 2 },
    )
    expect(result).toEqual([0, 1, 2])
  })
})

describe('Spawn <-> Function', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('proc-func', async () => {
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })

  it('func-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      $`${NODE} -e ${'process.stdin.pipe(process.stdout)'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })

  it('func-proc-func', async () => {
    await $(
      async $ => await $.stdout.write(HELLO_WORLD),
      $`${NODE} -e ${'process.stdin.pipe(process.stdout)'}`,
      async $ => await compareStreams($.stdin, HELLO_WORLD)
    )
  })
  
  it('proc-func-proc', async () => {
    const passThrough = new PassThrough()
    await $(
      $`${NODE} -e ${'process.stdout.write("hello world")'}`,
      async $ => { 
        $.stdin.pipe($.stdout)
        await once($.stdin, 'end') 
      },
      $`${NODE} -e ${'process.stdin.pipe(process.stdout)'}`
    )(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
})
