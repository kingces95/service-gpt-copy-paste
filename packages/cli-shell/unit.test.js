import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals } from '@kingjs/vitest'
import { CliShell, DISPOSE_TIMEOUT_MS } from '@kingjs/cli-shell'
import { PassThrough } from 'stream'
import { Path } from '@kingjs/path'
import { CliStdioLoader } from '@kingjs/cli-stdio-loader'
import { CliResource } from '@kingjs/cli-resource'
import { 
  compareStreams, 
  CliVitestPaths, 
  CliVitestPojo 
} from '@kingjs/cli-test'

expect.extend({ toBeEquals })

const __paths = new CliVitestPaths(import.meta)
const __pojo = new CliVitestPojo(__paths, { overwrite: true })

const NODE = process.execPath
const HELLO_WORLD = 'hello world'
const HELLO = 'hello'
const WORLD = 'world'
const processCwd = Path.create(process.cwd())

describe('The default shell', () => {
  let shell
  beforeEach(() => { 
    const { signal } = new AbortController()
    shell = new CliShell({ signal })
  })

  it('should throw if no signal is provided.', async () => {
    expect(() => new CliShell()).toThrow()
  })
  it('should be a CliShell.', async () => {
    expect(shell).toBeInstanceOf(CliShell)
  })
  it('should have a signal', async () => {
    expect(shell.signal).toBeInstanceOf(AbortSignal)
  })
  it('should have an env prototype of process.env.', async () => {
    expect(Object.getPrototypeOf(shell.env)).toBe(process.env)
  })
  it('should have frozen slots.', async () => {
    expect(Object.isFrozen(shell.slots)).toBe(true)
  })
  it('should have the default DISPOSE_TIMEOUT_MS.', async () => {
    expect(shell.disposeTimeoutMs).toBe(DISPOSE_TIMEOUT_MS)
  })
  it('should have a loader of type CliStdioLoader.', async () => {
    expect(shell.loader).toBeInstanceOf(CliStdioLoader)
  })
  it('should a pushd stack containing process.cwd.', async () => {
    expect(shell.dirs[0]).toBeEquals(Path.create(process.cwd()))
    expect(shell.dirs.length).toBe(1)
  })
  it('should have an empty alias map.', async () => {
    expect(shell.alias).toBeInstanceOf(Map)
    expect(shell.alias.size).toBe(0)
  })
  it('should thorw when and invlid slot is requested.', async () => {
    expect(() => shell.getStream(3)).toThrow()
    expect(() => shell.getStream(-1)).toThrow()
    expect(() => shell.getStream('invalid')).toThrow()
  })

  describe('slot 0', () => {
    let slot
    beforeEach(() => { slot = shell.slots[0] })

    it('should be a resource.', async () => {
      expect(slot).toBeInstanceOf(CliResource)
    })
    it('should be input.', async () => {
      expect(slot.isInput).toBe(true)
    })
    it('should have an fd of 0.', async () => {
      expect(slot.fd).toBe(0)
    })
    it('should not be owned.', async () => {
      expect(slot.isOwned).toBe(false)
    })
    it('should have a value equal to process.stdin.', () => {
      expect(slot.value).toBe(process.stdin)
    })
    it('should have a value equal to stdin stream.', () => {
      expect(slot.value).toBe(shell.stdin)
      expect(slot.value).toBe(shell.getStream(0))
      expect(slot.value).toBe(shell.getStream('stdin'))
    })
  })
  describe('slot 1', () => {
    let slot
    beforeEach(() => { slot = shell.slots[1] })

    it('should be a resource.', async () => {
      expect(slot).toBeInstanceOf(CliResource)
    })
    it('should be output.', async () => {
      expect(slot.isOutput).toBe(true)
    })
    it('should have an fd of 1.', async () => {
      expect(slot.fd).toBe(1)
    })
    it('should not be owned.', async () => {
      expect(slot.isOwned).toBe(false)
    })
    it('should have a value equal to process.stdout.', () => {
      expect(slot.value).toBe(process.stdout)
    })
    it('should have a value equal to stdout stream.', () => {
      expect(slot.value).toBe(shell.stdout)
      expect(slot.value).toBe(shell.getStream(1))
      expect(slot.value).toBe(shell.getStream('stdout'))
    })
  })
  describe('slot 2', () => {
    let slot
    beforeEach(() => { slot = shell.slots[2] })

    it('should be a resource.', async () => {
      expect(slot).toBeInstanceOf(CliResource)
    })
    it('should be output.', async () => {
      expect(slot.isOutput).toBe(true)
    })
    it('should have an fd of 2.', async () => {
      expect(slot.fd).toBe(2)
    })
    it('should not be owned.', async () => {
      expect(slot.isOwned).toBe(false)
    })
    it('should have a value equal to process.stderr.', () => {
      expect(slot.value).toBe(process.stderr)
    })
    it('should have a value equal to stderr stream.', () => {
      expect(slot.value).toBe(shell.stderr)
      expect(slot.value).toBe(shell.getStream(2))
      expect(slot.value).toBe(shell.getStream('stderr'))
    })
  })
})

describe('A subshell of the default shell', () => {
  let shell
  let subshell
  beforeEach(() => { 
    const { signal } = new AbortController()
    shell = new CliShell({ signal })
    subshell = shell() 
  })

  it('should be a CliShell.', async () => {
    expect(subshell).toBeInstanceOf(CliShell)
  })
  it('should have an env prototype inherited from the parent.', async () => {
    expect(Object.getPrototypeOf(subshell.env)).toBe(shell.env)
  })
  it('should have a slots prototype inherited from the parent.', async () => {
    expect(Object.getPrototypeOf(subshell.slots)).toBe(shell.slots)
  })
  it('should have forzen slots.', async () => {
    expect(Object.isFrozen(subshell.slots)).toBe(true)
  })
  it('should have the same signal as the parent.', async () => {
    expect(subshell.signal).toBe(shell.signal)
  })
  it('should have the same dispose timeout as the parent.', async () => {
    expect(subshell.disposeTimeoutMs).toBe(shell.disposeTimeoutMs)
  })
  it('should have the same loader as the parent.', async () => {
    expect(subshell.loader).toBe(shell.loader)
  })
  it('should have a copy of the parent pushd stack.', async () => {
    expect(subshell.dirs).not.toBe(shell.dirs)
    expect(subshell.dirs).toEqual(shell.dirs)
  })
  it('should have a copy of the parent alias map.', async () => {
    expect(subshell.alias).not.toBe(shell.alias)
    expect(subshell.alias).toEqual(shell.alias)
  })
})

describe('A subshell that declares new environment variables', () => {
  let shell
  let subshell
  beforeEach(() => { 
    const { signal } = new AbortController()
    shell = new CliShell({ signal })
    subshell = shell({ p0: HELLO, p1: WORLD })
  })

  it('has an env with prototype equal to the parent env.', async () => {
    expect(Object.getPrototypeOf(subshell.env)).toBe(shell.env)
  })
  it('inherits those env variables.', async () => {
    expect(subshell.env.p0).toBe(HELLO)
    expect(subshell.env.p1).toBe(WORLD)
  })
  it('does not affect parent environment.', async () => {
    expect(shell.env.p0).toBe(undefined)
    expect(shell.env.p1).toBe(undefined)
  })
})

describe('A shell initialized with a pushd stack', () => {
  let shell
  let pushdStack
  beforeEach(() => {
    pushdStack = [
      Path.create('/foo/bar/baz/hello'),
      Path.create('/foo/bar/baz'),
    ]
    const { signal } = new AbortController()
    shell = new CliShell({ signal, pushdStack })
  })
  it('should return cwd as the first element.', async () => {
    expect(shell.cwd).toBeEquals(pushdStack[0])
  })
  it('can create subshells that inherit the pushd stack.', async () => {
    const subshell = new CliShell({ parent: shell })
    expect(subshell.cwd).toBeEquals(shell.cwd)
    expect(subshell.dirs).not.toBe(shell.dirs)
    expect(subshell.dirs[0]).toEqual(shell.dirs[0])
    expect(subshell.dirs[1]).toEqual(shell.dirs[1])
  })
})

describe('A shell cwd initialized with a cwd', () => {
  let shell
  let path
  beforeEach(() => { 
    path = Path.create('/foo/bar/baz')
    const { signal } = new AbortController()
    shell = new CliShell({ signal, pushdStack: [ path ] }) 
  })

  it('should return that cwd.', async () => {
    expect(shell.cwd).toBeEquals(path)
  })
  it ('should have dirs array containing just the path.', async () => {
    expect(shell.dirs).toEqual([path])
  })
  it('should still be the path if dot is pushed.', async () => {
    shell.pushd('.')
    expect(shell.cwd).toBeEquals(path)
  })
  it('should still be the path if popped.', async () => {
    shell.popd()
    expect(shell.cwd).toBeEquals(path)
  })
  it('should still be the path if Path.current pushed.', async () => {
    shell.pushd(Path.current)
    expect(shell.cwd).toBeEquals(path)
  })
  it('should be a subdirectory of cwd if the name of a dir is pushed.', async () => {
    shell.pushd(HELLO)
    expect(shell.cwd).toBeEquals(path(HELLO))
  })
  it('should be dir if a subdir is pushed and popped.', async () => {
    shell.pushd(HELLO)
    shell.popd()
    expect(shell.cwd).toBeEquals(path)
  })
  it('should resolve and path and return a pushed relative subdir.', async () => {
    const subdir = shell.pushd(HELLO)
    expect(subdir).toBeEquals(path(HELLO))
    expect(shell.cwd).toBeEquals(path(HELLO))
  })
  it('should be an absolute path if an absolute path is pushed.', async () => {
    const altPath = Path.create('/alt/absolute/path')
    shell.pushd(altPath)
    expect(shell.cwd).toBeEquals(altPath)
  })
  it('should have a .dirs of subdir then the path after pushing the subdir.', async () => {
    const subdir = shell.pushd(HELLO)
    expect(shell.dirs.length).toBe(2)
    expect(shell.dirs[0]).toBeEquals(subdir)
    expect(shell.dirs[1]).toBeEquals(path)
  })
  it('should be the parent of path if backtrack pushed.', async () => {
    shell.pushd('..')
    expect(shell.cwd).toBeEquals(path('..'))
  })
  it('should return copies of .dirs array.', async () => {
    expect(shell.dirs).not.toBe(shell.dirs)
  })
})

describe('A shell expansion of a command', () => {
  let $
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

  describe('without any aliases', () => {
    it('should return the command without substitution.', async () => {
      const args = $.expand('bash', '-c', 'echo', HELLO_WORLD)
      expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
    })
  })

  describe('with an alias that maps "shell" to "bash"', () => {
    beforeEach(() => {
      $.alias.set('shell', (...args) => ['bash', ...args])
    })

    it('should return a command after mapping "shell" to "bash".', async () => {
      const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
      expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
    })

    describe('which creates a subshell', () => {
      describe('which expands the command', () => {
        it('should return a command after mapping "shell" to "bash".', async () => {
          await $($ => {
            const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
            expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
          })
        })
      })
      describe('which overrides the alias to map "shell" to "sh"', () => {
        it('should return a command after mapping "shell" to "sh".', async () => {
          await $($ => {
            $.alias.set('shell', (...args) => ['sh', ...args])
            const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
            expect(args).toEqual(['sh', '-c', 'echo', HELLO_WORLD])
          })
        })
      })
      describe('which exits and returns control to the parent shell', () => {
        it('should return a command after mapping "shell" to "bash".', async () => {
          await $($ => {
            $.alias.set('shell', (...args) => ['sh', ...args])
          })
          const args = $.expand('shell', '-c', 'echo', HELLO_WORLD)
          expect(args).toEqual(['bash', '-c', 'echo', HELLO_WORLD])
        })
      })
    })
  })
})

describe('A shell launches a node process', () => {
  let $
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

  describe('via tagged template literal syntax', () => {
    it('should should work.', async () => {
      const passThrough = new PassThrough()
      await $`${NODE} -e ${`process.stdout.write("${HELLO_WORLD}")`}`(passThrough)
      passThrough.end()
      await compareStreams(passThrough, HELLO_WORLD)
    })
    describe('using an alias for "node"', () => {
      it('should also work.', async () => {
        const passThrough = new PassThrough()
        await $`node -e ${`process.stdout.write("${HELLO_WORLD}")`}`(passThrough)
        passThrough.end()
        await compareStreams(passThrough, HELLO_WORLD)
      })
    })
  })

  describe('via spawn', () => {
    it('should should work.', async () => {
      const passThrough = new PassThrough()
      await $.spawn(
        NODE, '-e', `process.stdout.write("${HELLO_WORLD}")`)
        (passThrough)
      passThrough.end()
      await compareStreams(passThrough, HELLO_WORLD)
    })
    describe('using an alias for "node"', () => {
      it('should also work.', async () => {
        $.alias.set('node', (...args) => [NODE, '-e', ...args])
    
        const passThrough = new PassThrough()
        await $.spawn(
          'node', `process.stdout.write("${HELLO_WORLD}")`)
          (passThrough)
        passThrough.end()
        await compareStreams(passThrough, HELLO_WORLD)
      })
    })
  })
})

describe('A shell launches a subshell with a function', () => {
  let $
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

  it('should call the function', async ({ task }) => {
    let called = false
    const subshell = $(() => called = true)
    await __pojo.expect(subshell, task)
    await subshell
    expect(called).toBe(true)
  })
  
  it('should call a function in another subshell', async ({ task }) => {
    let called = false
    const subshell = $($(() => called = true))
    await __pojo.expect(subshell, task)
    await subshell
    expect(called).toBe(true)
  })

  it('bad-subshell', async () => {
    expect(() => $(1)).toThrow()
    expect(() => $('hello')).toThrow()
  })
})

describe('A shell that is invoked with an array of subshells', () => {
  let $
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

  it('of length one, should return the subshell', async ({ task }) => {
    const stage = $(function one() { })
    const pipeline = $(stage)
    expect(pipeline).toBe(stage)
    await __pojo.expect(stage, task)
  })

  it('of length two, should return the last subshell', async ({ task }) => {
    const passThrough = new PassThrough()
    const stages = [
      $(function one() { }),
      $(function two() { }),
    ]
    const stage = $(...stages)(passThrough)

    const [ first, last ] = stages
    expect(stage).toBe(last)
    await __pojo.expect(stage, task)
  })

  it('of length three, should return the last subshell', async ({ task }) => {
    const passThrough = new PassThrough()
    const stages = [
      $(function one() { }),
      $(function two() { }),
      $(function three() { }),
    ]
    const stage = $(...stages)(passThrough)

    const [ first, middle, last ] = stages
    expect(stage).toBe(last)
    await __pojo.expect(stage, task)
  })
})

describe('reader', () => {
  let $
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

  it('read-char', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD)
    passThrough.end()
    await $(async $ => {
      const result = await $.readChar()
      expect(result).toBe(HELLO_WORLD.charAt(0))
    })({ stdin: passThrough })
  })

  it('read-string', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD)
    passThrough.end()
    await $(async $ => {
      const result = await $.readString(2)
      expect(result).toBe(HELLO_WORLD.substring(0, 2))
    })({ stdin: passThrough })
  })

  it('readLine', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD + '\n' + HELLO)
    passThrough.end()
    await $(async $ => {
      const helloWorld = await $.readLine()
      expect(helloWorld).toBe(HELLO_WORLD)
      const hello = await $.readLine()
      expect(hello).toBe(HELLO)
    })({ stdin: passThrough })
  })

  it('async-iterator', async () => {
    const passThrough = new PassThrough()
    passThrough.write(HELLO_WORLD + '\n' + HELLO)
    passThrough.end()
    await $(async $ => {
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
    await $(async $ => {
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
    await $(async $ => {
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
    await $(async $ => {
      const record = await $.readRecord({ value: '' })
      expect(record.value).toBe(HELLO)
    })({ stdin: passThrough })
  })
  
  it('read-record-true', async () => {
    const passThrough = new PassThrough()
    passThrough.write('1 true True')
    passThrough.end()
    await $(async $ => {
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
    await $(async $ => {
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
    await $(async $ => {
      const record = await $.readRecord({ n0: '#', n1: '#' })
      expect(record.n0).toBe(0)
      expect(record.n1).toBe(1)
    })({ stdin: passThrough })
  })
})

describe('writer', () => {
  let $
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

  it('echo', async () => {
    const passThrough = new PassThrough()
    await $(async $ => {
      await $.echo(HELLO_WORLD)
    })(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n')
  })
  
  it('echo-record', async () => {
    const passThrough = new PassThrough()
    await $(async $ => {
      await $.echoRecord([HELLO, WORLD])
    })(passThrough)
    passThrough.end()
    await compareStreams(passThrough, HELLO_WORLD + '\n')
  })
})

describe('publish', () => {
  let $
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

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
  beforeEach(() => { 
    const { signal } = new AbortController()
    $ = new CliShell({ signal }) 
  })

  it('implicit', async ({ task }) => {
    const producer = new PassThrough()
    producer.write(HELLO_WORLD)
    producer.end()

    await $(async $ => {
      const consumer = new PassThrough()
      const subshell = $.spawn(
        NODE, 
        '-e', 
        `process.stdout.write("${HELLO_WORLD}")`
      )(consumer)({
        // Uncomment out to observe issue with implicit inheritance of stdin
        // Only happens if stdin is not backed by an fd. In that case, stdin
        // is fetched as part of the piping process into the spawned process.
        // If the process does nont consume stdin, then the fetched data is lost.
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