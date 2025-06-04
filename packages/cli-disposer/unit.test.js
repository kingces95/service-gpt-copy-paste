// hello world
import assert from 'assert'
import { CliStreamDisposer } from './index.js'
import { AbortError } from '@kingjs/abort-error'
import { TimeoutError } from '@kingjs/timeout-error'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createReadStream, createWriteStream } from 'fs'
import { fileURLToPath } from 'url'
import { EventEmitter, once } from 'events'
import path from 'path'
import fs from 'fs'

describe('A CliStreamDisposer', () => {
  describe('of a Readable stream', () => {
    let stream
    let disposer
    beforeEach(async () => {
      stream = createReadStream(fileURLToPath(import.meta.url), {
        encoding: 'utf8',
        autoClose: true,
        emitClose: true
      })
      await once(stream, 'open')
      disposer = CliStreamDisposer.fromReader(stream)
    })
    it('should return the stream.', () => {
      expect(disposer.resource).toEqual(stream)
    })
    describe('that has not been disposed', () => {
      it('should not be disposed.', () => {
        expect(disposer.isDisposed).toBe(false)
      })
      describe('after disposal', () => {
        let result
        beforeEach(async () => {
          result = await disposer.dispose()
        })
        it('should report a successful disposal.', () => {
          expect(result).toBeUndefined()
        })
        it('should have closed the stream.', () => {
          expect(stream.closed).toBe(true)
        })
        it('should throw on resource access.', () => {
          expect(() => disposer.resource).toThrow('Resource is disposed')
        })
        it('should report being disposed.', () => {
          expect(disposer.isDisposed).toBe(true)
        })
        it('should throw on dispose again.', async () => {
          await expect(disposer.dispose()).rejects.toThrow('Resource is disposed')
        })
      })
    })
    describe('that has its fd closed', () => {
      beforeEach(() => {
        // close the stream's fd
        fs.closeSync(stream.fd, (err) => {
          if (err) console.error(`Failed to close stream fd: ${err.message}`)
        })
      })
      it('should throw trying to dispose.', async () => {
        await expect(disposer.dispose()).rejects
          .toThrow('EBADF: bad file descriptor, close')
      })
    })
    describe('that has already been destoryed', () => {
      beforeEach(async () => {
        // close the stream
        stream.destroy() 

        // wait for the stream to close
        await once(stream, 'close') 
      })
      it('should be disposed.', () => {
        expect(disposer.isDisposed).toBe(false)
      })
      describe('after disposal', () => {
        let result
        beforeEach(async () => {
          result = await disposer.dispose()
        })
        it('should throw on dispose again.', async () => {
          await expect(disposer.dispose()).rejects.toThrow('Resource is disposed')
        })
      })
    })
  })
  describe('of a Wrtable stream to a temp file', () => {
    let stream
    let filePath
    beforeEach(() => {
      const tempDir = process.env.TEMP || process.env.TMPDIR || '/tmp'
      const randomFileName = `test-${Math.random().toString(36).substring(2)}.txt`
      filePath = path.join(tempDir, randomFileName) 

    })
    afterEach(() => {
      if (stream.path) {
        fs.unlink(stream.path, (err) => {
          if (err) console.error(`Failed to delete temp file: ${err.message}`)
        })
      }
    })
    describe('that has not been disposed', () => {
      let content = 'Hello, World!\n'
      let disposer
      beforeEach(async () => {
        stream = createWriteStream(filePath, {
          encoding: 'utf8',
          autoClose: true,
          emitClose: true
        })
        // await for the stream to be ready
        await once(stream, 'open')
        disposer = CliStreamDisposer.fromWriter(stream)     
        
        // await write content
        await new Promise(resolve => {
          stream.write(content, 'utf8', resolve)
        })
      })
      it('should return the stream.', () => {
        expect(disposer.resource).toEqual(stream)
      })
      it('should not be disposed.', () => {
        expect(disposer.isDisposed).toBe(false)
      })
      describe('after disposal', () => {
        let result
        beforeEach(async () => {
          result = await disposer.dispose()
        })
        it('should report a successful disposal.', () => {
          expect(result).toBeUndefined()
        })
        it('should have written the content to the file.', () => {
          const fileContent = fs.readFileSync(filePath, 'utf8')
          expect(fileContent).toBe(content)
        })
        it('should have called the dispose function.', () => {
          expect(stream.closed).toBe(true)
        })
        it('should throw on resource access.', () => {
          expect(() => disposer.resource).toThrow('Resource is disposed')
        })
        it('should report being disposed.', () => {
          expect(disposer.isDisposed).toBe(true)
        })
        it('should throw on dispose again.', async () => {
          await expect(disposer.dispose()).rejects.toThrow('Resource is disposed')
        })
      })
    })
    describe('that has already been ended', () => {
      let disposer
      beforeEach(async () => {
        stream = createWriteStream(filePath, {
          encoding: 'utf8',
          autoClose: true,
          emitClose: true
        })

        // await for the stream to be ready
        await once(stream, 'open')

        disposer = CliStreamDisposer.fromWriter(stream)
          
        // close the stream
        stream.end() 

        // wait for the stream to close
        await once(stream, 'close') 
      })
      it('should return the stream.', () => {
        expect(disposer.resource).toEqual(stream)
      })
      it('should not be disposed.', () => {
        expect(disposer.isDisposed).toBe(false)
      })
      describe('after disposal', () => {
        let result
        beforeEach(async () => {
          result = await disposer.dispose()
        })
        it('should report a successful disposal.', () => {
          expect(result).toBeUndefined()
        })
      })
    })
  })
})
