import { describe, it, expect, beforeEach } from 'vitest'
import { CliShell } from '@kingjs/cli-shell'
import { PassThrough } from 'stream'
import path from 'path'
import { 
  compareStreams, 
  CliVitestPaths, 
  CliVitestPojo 
} from '@kingjs/cli-test'

const __paths = new CliVitestPaths(import.meta)
const __pojo = new CliVitestPojo(__paths, { overwrite: true })

const NODE = process.execPath
const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'

describe('scope', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('add', async () => {
    await $.scope({ HELLO: HELLO })
      .subshell($ => {
        expect($.env.HELLO).toBe(HELLO)
      })
    expect($.env.HELLO).toBe(undefined)
  })
  
  it('add', async () => {
    $.env.HELLO = HELLO
    await $.scope($ => {
      expect($.env.HELLO).toBe(HELLO)

      $.env.HELLO = WORLD
      expect($.env.HELLO).toBe(WORLD)
    })
    expect($.env.HELLO).toBe(HELLO)
  })

  it('remove', async () => {
    $.env.HELLO = HELLO
    await $.scope($ => {
      expect($.env.HELLO).toBe(HELLO)

      // unlike bash unset, delete exposes the inherited value
      delete $.env.HELLO 
      expect($.env.HELLO).toBe(HELLO)
    })
    expect($.env.HELLO).toBe(HELLO)
  })

  it('add-add', async () => {
    await $.scope({ HELLO: HELLO })
      .subshell(async $ => {
        expect($.env.HELLO).toBe(HELLO)

        await $.scope({ WORLD: WORLD })
          .subshell($ => {
            expect($.env.HELLO).toBe(HELLO)
            expect($.env.WORLD).toBe(WORLD)
          })
        expect($.env.HELLO).toBe(HELLO)
        expect($.env.WORLD).toBe(undefined)
      })
    expect($.env.HELLO).toBe(undefined)
    expect($.env.WORLD).toBe(undefined)
  })
})

describe('cwd', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('default', async () => {
    expect($.cwd).toBe(process.cwd())
  })

  it('pushd-self', async () => {
    $.pushd('.')
    expect($.cwd).toBe(process.cwd())
  })

  it('pushd-relative', async () => {
    $.pushd(HELLO)
    const hello = path.join(process.cwd(), HELLO)
    expect($.cwd).toBe(hello)
  })

  it('pushd-absolute', async () => {
    const hello = path.join(process.cwd(), HELLO)
    $.pushd(hello)
    expect($.cwd).toBe(hello)
  })

  it('pushd-normalize', async () => {
    const up = path.join(process.cwd(), '..')
    $.pushd('..')
    expect($.cwd).toBe(up)
  })

  it('dirs', async () => {
    $.pushd(HELLO)
    const hello = path.join(process.cwd(), HELLO)
    const dirs = [hello, process.cwd()]
    expect($.dirs).toEqual(dirs)
  })

  it('dirs-is-a-copy', async () => {
    expect($.dirs).not.toBe($.dirs)
  })

  it('popd', async () => {
    $.pushd(HELLO)
    const hello = path.join(process.cwd(), HELLO)
    expect($.cwd).toBe(hello)

    $.popd()
    expect($.cwd).toBe(process.cwd())
  })

  it('popd-last', async () => {
    $.popd()
    expect($.cwd).toBe(process.cwd())
  })
})

describe('streams', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('stdin', async () => {
    expect($.stdin).toBe($.getStream(0))
    expect($.stdin).toBe($.getStream('stdin'))
  })

  it('stdout', async () => {
    expect($.stdout).toBe($.getStream(1))
    expect($.stdout).toBe($.getStream('stdout'))
  })

  it('stderr', async () => {
    expect($.stderr).toBe($.getStream(2))
    expect($.stderr).toBe($.getStream('stderr'))
  })

  it('invalid-slots', async () => {
    expect(() => $.getStream(3)).toThrow()
    expect(() => $.getStream(-1)).toThrow()
    expect(() => $.getStream('invalid')).toThrow()
  })
})

describe('expand', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('expand', async () => {
    const args = $.expand('bash', '-c', 'echo', HELLO_WORLD)
    expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
  })

  it('alias', async () => {
    $.alias.set('shell', (...args) => ['bash', ...args])
    const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
    expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
  })

  it('alias-alias', async () => {
    $.alias.set('shell', (...args) => ['bash', ...args])
    const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
    expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])

    await $.subshell($ => {
      const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
      expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])

      {
        $.alias.set('shell', (...args) => ['sh', ...args])
        const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
        expect(args).toEqual(['sh', '-c', 'echo', HELLO_WORLD])
      }
    })

    {
      const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
      expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
    }
  })
})

describe('spawn', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('node', async () => {
    const passThrough = new PassThrough()
    await $.spawn(
      NODE, '-e', `process.stdout.write("${HELLO_WORLD}")`)
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
  
  it('alias', async () => {
    $.alias.set('node', (...args) => [NODE, '-e', ...args])

    const passThrough = new PassThrough()
    await $.spawn(
      'node', `process.stdout.write("${HELLO_WORLD}")`)
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD)
  })
})

describe('subshell', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('null', async () => {
    const subshell = $.subshell()
    expect(subshell).toBe(undefined)
  })

  it('function', async ({ task }) => {
    let called = false
    const subshell = $.subshell(() => called = true)
    await __pojo.expect(subshell, task)
    await subshell
    expect(called).toBe(true)
  })
  
  it('function-function', async ({ task }) => {
    let called = false
    const subshell = $.subshell($.subshell(() => called = true))
    await __pojo.expect(subshell, task)
    await subshell
    expect(called).toBe(true)
  })

  it('bad-subshell', async () => {
    expect(() => $.subshell(1)).toThrow()
    expect(() => $.subshell('hello')).toThrow()
  })
})

describe('pipeline', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('one-stage', async ({ task }) => {
    const stage = $.subshell(function one() { })
    const pipeline = $.pipeline(stage)
    expect(pipeline).toBe(stage)
    await __pojo.expect(stage, task)
  })

  it('two-stage', async ({ task }) => {
    const passThrough = new PassThrough()
    const stages = [
      $.subshell(function one() { }),
      $.subshell(function two() { }),
    ]
    const stage = $.pipeline(...stages)(passThrough)

    const [ first, last ] = stages
    expect(stage).toBe(last)
    await __pojo.expect(stage, task)
  })

  it('three-stage', async ({ task }) => {
    const passThrough = new PassThrough()
    const stages = [
      $.subshell(function one() { }),
      $.subshell(function two() { }),
      $.subshell(function three() { }),
    ]
    const stage = $.pipeline(...stages)(passThrough)

    const [ first, middle, last ] = stages
    expect(stage).toBe(last)
    await __pojo.expect(stage, task)
  })
})

describe('reader', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('read-byte', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD)
    passThrough.end()
    await $.subshell(async $ => {
      const result = await $.readByte()
      const byte = HELLO_WORLD.charCodeAt(0)
      expect(result).toBe(byte)
    })({ stdin: passThrough })  
  })

  it('read-char', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD)
    passThrough.end()
    await $.subshell(async $ => {
      const result = await $.readChar()
      expect(result).toBe(HELLO_WORLD.charAt(0))
    })({ stdin: passThrough })
  })

  it('read-string', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD)
    passThrough.end()
    await $.subshell(async $ => {
      const result = await $.readString(2)
      expect(result).toBe(HELLO_WORLD.substring(0, 2))
    })({ stdin: passThrough })
  })

  it('read', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD + '\n' + HELLO)
    passThrough.end()
    await $.subshell(async $ => {
      const helloWorld = await $.read()
      expect(helloWorld).toBe(HELLO_WORLD)
      const hello = await $.read()
      expect(hello).toBe(HELLO)
    })({ stdin: passThrough })
  })

  it('async-iterator', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD + '\n' + HELLO)
    passThrough.end()
    await $.subshell(async $ => {
      let lines = []
      for await (const list of $) 
        lines.push(list)
      const [ helloWorld, hello ] = lines
      expect(helloWorld).toBe(HELLO_WORLD)
      expect(hello).toBe(HELLO)
    })({ stdin: passThrough })
  })

  it('read-array', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD + '\n' + HELLO)
    passThrough.end()
    await $.subshell(async $ => {
      const [ hello, world ] = await $.readArray()
      expect(hello).toBe(HELLO)
      expect(world).toBe(WORLD)
      const [ hello$ ] = await $.readArray()
      expect(hello$).toBe(HELLO)
    })({ stdin: passThrough })
  })

  it('read-record-array', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD + '\n' + HELLO)
    passThrough.end()
    await $.subshell(async $ => {
      const record = await $.readRecord([ 'hello', 'world' ])
      expect(record.hello).toBe(HELLO)
      expect(record.world).toBe(WORLD)
      const record$ = await $.readRecord([ 'hello' ])
      expect(record$.hello).toBe(HELLO)
    })({ stdin: passThrough })
  })
  
  it('read-record-string', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO)
    passThrough.end()
    await $.subshell(async $ => {
      const record = await $.readRecord({ value: '' })
      expect(record.value).toBe(HELLO)
    })({ stdin: passThrough })
  })
  
  it('read-record-true', async () => {
    const passThrough = new PassThrough()
    passThrough.write('1 true True')
    passThrough.end()
    await $.subshell(async $ => {
      const record = await $.readRecord({ p0: '!', p1: '!', p2: '!' })
      expect(record.p0).toBe(true)
      expect(record.p1).toBe(true)
      expect(record.p2).toBe(true)
    })({ stdin: passThrough })
  })

  it('read-record-false', async () => {
    const passThrough = new PassThrough()
    passThrough.write('0 false False')
    passThrough.end()
    await $.subshell(async $ => {
      const record = await $.readRecord({ p0: '!', p1: '!', p2: '!' })
      expect(record.p0).toBe(false)
      expect(record.p1).toBe(false)
      expect(record.p2).toBe(false)
    })({ stdin: passThrough })
  })

  it('read-record-number', async () => {
    const passThrough = new PassThrough()
    passThrough.write('0 1')
    passThrough.end()
    await $.subshell(async $ => {
      const record = await $.readRecord({ n0: '#', n1: '#' })
      expect(record.n0).toBe(0)
      expect(record.n1).toBe(1)
    })({ stdin: passThrough })
  })
})

describe('writer', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('echo', async () => {
    const passThrough = new PassThrough()
    await $.subshell(async $ => {
      await $.echo(HELLO_WORLD)
    })(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n')
  })
  
  it('echo-record', async () => {
    const passThrough = new PassThrough()
    await $.subshell(async $ => {
      await $.echoRecord([HELLO, WORLD])
    })(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n')
  })
})

describe('publish', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('noop', async () => {
    const result = $()
    expect(result).toBe(undefined)
  })

  it('variable', async () => {
    const result = $({ hello: HELLO })
    const { hello } = result.env
    expect(hello).toBe(HELLO)
  })

  it('tagged-template-literal', async () => {
    const ttl = await $`${NODE} -e ${'process.exit(42)'}`
    expect(ttl).toEqual([42])
  })

  it('tagged-template-literal', async () => {
    const ttl = await $`${[NODE, '-e', 'process.exit(42)']}`
    expect(ttl).toEqual([42])
  })

  it('pipeline', async () => {
    const passThrough = new PassThrough()
    await $($ => $.echo(HELLO_WORLD))
      (passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n')
  })
})

describe('stdin-consumption-problem', () => {
  let $
  beforeEach(() => { $ = new CliShell() })

  it('implicit', async ({ task }) => {
    const producer = new PassThrough()
    producer.write(HELLO_WORLD)
    producer.end()

    await $.subshell(async $ => {
      const consumer = new PassThrough()
      const subshell = $.spawn(
        NODE, 
        '-e', 
        `process.stdout.write("${HELLO_WORLD}")`
      )(consumer)({
        // Uncomment out to observe issue with implicit inheritance of stdin
        // Only happens if stdin is not backed by an fd. In that case, stdin
        // is fetched as part of the piping process into the spawned process.
        // If the process does nont consume stdin, then the fetched dats is lost.
        // stdin: $.stdin
      })
      await __pojo.expect(subshell, task)
      await subshell

      consumer.end()
      await compareStreams(consumer, HELLO_WORLD)
    })({ stdin: producer })

    // This fails if the stdin: $.stdin is uncommented
    await compareStreams(producer, HELLO_WORLD)
  })
})