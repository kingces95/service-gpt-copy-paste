// hello world
import { sip } from './index.js'
import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals, toBeDecodedAs, toText } from '@kingjs/vitest'
import { Readable } from 'stream'
import { PassThrough } from 'stream'
import { AbortError } from '@kingjs/abort-error'
import { sleep } from '@kingjs/sleep'

expect.extend({ toBeEquals, toBeDecodedAs })

describe('A pass through stream', () => {
  let stream
  beforeEach(() => {
    stream = new PassThrough()
  })
  describe('that is ended', () => {
    beforeEach(() => {
      stream.end()
    })
    it('should not be destroyed.', () => {
      expect(stream.destroyed).toBe(false)
    })
    describe('that generates a result.', async () => {
      let done, value
      beforeEach(async () => {
        const iterator = stream[Symbol.asyncIterator]()
        const result = await iterator.next()
        done = result.done
        value = result.value
      })
      it('should be done.', () => {
        expect(done).toBe(true)
      })
      it('should be readableEnded.', () => {
        expect(stream.readableEnded).toBe(true)
      })
      it('should no longer be readable.', () => {
        expect(stream.readable).toBe(false)
      })
      it('should yield no value.', () => {
        expect(value).toBeUndefined()
      })
      it('should destroy the stream.', () => {
        expect(stream.destroyed).toBe(true)
      })
      it('should hang if piping attempted.', () => {
        const passThrough = new PassThrough()
        const promise = new Promise((resolve, reject) => {
          stream.on('error', reject)
          stream.on('end', resolve)
          stream.pipe(passThrough)
        }).then(() => false)
        const timeout = sleep(25).then(() => true)
        return expect(Promise.any([promise, timeout])).resolves.toBe(true)
      })
    })
  })
  describe('that is destroyed', () => {
    beforeEach(() => {
      stream.destroy()
    })
    it('should throw if iteration attempted.', () => {
      const iterator = stream[Symbol.asyncIterator]()
      const promise = iterator.next()
      return expect(promise).rejects.toThrow('Premature close')
    })
    it('should be destroyed.', () => {
      expect(stream.destroyed).toBe(true)
    })
    it('should *not* be readableEnded.', () => {
      expect(stream.readableEnded).toBe(false)
    })
    it('should no longer be readable.', () => {
      expect(stream.readable).toBe(false)
    })
    it('should hang if piping attempted.', () => {
      const passThrough = new PassThrough()
      const promise = new Promise((resolve, reject) => {
        stream.on('error', reject)
        stream.on('end', resolve)
        stream.pipe(passThrough)
      }).then(() => false)
      const timeout = sleep(25).then(() => true)
      return expect(Promise.any([promise, timeout])).resolves.toBe(true)
    })
  })
})

describe('A sip generator', () => {
  let stream
  let generator
  beforeEach(() => {
    stream = new PassThrough()
    generator = sip(stream)
  })

  describe('that is disposed', () => {
    beforeEach(async () => {
      await generator.dispose()
    })
    it('should destroy the stream.', () => {
      expect(stream.destroyed).toBe(true)
    })
    it('should no longer be readable.', () => {
      expect(stream.readable).toBe(false)
    })
    it('should *not* be readableEnded.', () => {
      expect(stream.readableEnded).toBe(false)
    })
    it('should be re-disposable.', async () => {
      await generator.dispose()
      expect(stream.destroyed).toBe(true)
    })
    describe('that promises to generate a result', () => {
      let promise
      beforeEach(() => {
        promise = generator.next()
      })
      it('should throw an error.', async () => {
        await expect(promise).rejects.toThrow('Premature close')
      })
    })
    describe('that promises to pipe', () => {
      let passThrough
      let promise
      beforeEach(() => {
        passThrough = new PassThrough()
        promise = generator.pipe(passThrough)
      })
      it('should throw.', async () => {
        await expect(promise).rejects.toThrow('Premature close')
      })
    })
    describe('that promises to return the readAll of the stream', () => {
      let promise
      beforeEach(() => {
        promise = generator.readAll()
      })
      it('should throw.', async () => {
        await expect(promise).rejects.toThrow('Premature close')
      })
    })
  })
  describe('that is ended', () => {
    beforeEach(async () => {
      stream.end()
    })
    it('should not destroy the stream.', () => {
      expect(stream.destroyed).toBe(false)
    })
    it('should not be readableEnded.', () => {
      expect(stream.readableEnded).toBe(false)
    })
    it('should be readable.', () => {
      expect(stream.readable).toBe(true)
    })
    describe('that generates a result', () => {
      let done, value, eof, decoder
      beforeEach(async () => {
        const result = await generator.next()
        done = result.done
        eof = result.value.eof
        decoder = result.value.decoder
      })
      it('should not be done.', async () => {
        expect(done).toBe(false)
      })
      it('should report end-of-file.', async () => {
        expect(eof).toBe(true)
      })
      it('should yield an empty decoder.', async () => {
        expect(decoder.toString()).toBe('')
      })
      it('should destroy the stream.', async () => {
        expect(stream.destroyed).toBe(true)
      })
      it('should end the stream.', async () => {
        expect(stream.readableEnded).toBe(true)
      })
      describe('then generates another result', () => {
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          value = result.value
        })
        it('should be done.', async () => {
          expect(done).toBe(true)
        })
        it('should yield no value.', async () => {
          expect(value).toBeUndefined()
        })
        it('should destroy the stream.', async () => {
          expect(stream.destroyed).toBe(true)
        })
        describe('then generates another result', () => {
          beforeEach(async () => {
            const result = await generator.next()
            done = result.done
            value = result.value
          })
          it('should be done.', async () => {
            expect(done).toBe(true)
          })
          it('should yield no value.', async () => {
            expect(value).toBeUndefined()
          })
        })
      })
      describe('then returns the readAll of the stream', async () => {
        let readAll
        beforeEach(async () => {
          readAll = await generator.readAll()
        })
        it('should return an empty string.', async () => {
          expect(readAll).toBe('')
        })
      })
      describe('then pipes into a pass-through stream', () => {
        let passThrough
        beforeEach(() => {
          passThrough = new PassThrough()
          generator.pipe(passThrough)
        })
        it('should pipe an empty string.', async () => {
          await expect(passThrough).toBeDecodedAs('')
        })
      })
    })
    describe('that returns the readAll of the stream', async () => {
      let readAll
      beforeEach(async () => {
        readAll = await generator.readAll()
      })
      it('should return an empty string.', async () => {
        expect(readAll).toBe('')
      })
      it('should destroy the stream.', async () => {
        expect(stream.destroyed).toBe(true)
      })
      describe('then generates a result', () => {
        let done, value
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          value = result.value
        })
        it('should be done.', async () => {
          expect(done).toBe(true)
        })
        it('should yield no value.', async () => {
          expect(value).toBeUndefined()
        })
      })
      describe('then pipes into a pass-through stream', () => {
        let passThrough
        beforeEach(() => {
          passThrough = new PassThrough()
          generator.pipe(passThrough)
        })
        it('should pipe an empty string.', async () => {
          await expect(passThrough).toBeDecodedAs('')
        })
      })
    })
    describe('that is piped into a pass-through stream', () => {
      let passThrough
      let text
      beforeEach(async () => {
        passThrough = new PassThrough()
        generator.pipe(passThrough)
        text = await toText(passThrough)
      })
      it('should pipe an empty string.', async () => {
        expect (text).toBe('')
      })
      it('should destroy the stream.', async () => {
        expect(stream.destroyed).toBe(true)
      })
      describe('then generates a result', () => {
        let done, value
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          value = result.value
        })
        it('should be done.', async () => {
          expect(done).toBe(true)
        })
        it('should yield no value.', async () => {
          expect(value).toBeUndefined()
        })
      })
    })
  })
  describe('consuming a stream that has pushed an empty string', () => {
    beforeEach(() => {
      stream.write(Buffer.from(''))
      stream.end()
    })
    describe('that generates a result', () => {
      let done, eof, decoder
      beforeEach(async () => {
        const result = await generator.next()
        done = result.done
        eof = result.value.eof
        decoder = result.value.decoder
      })
      it('should not be done.', async () => {
        expect(done).toBe(false)
      })
      it('should report end-of-file.', async () => {
        expect(eof).toBe(true)
      })
      it('should yield an empty decoder.', async () => {
        expect(decoder.toString()).toBe('')
      })
      describe('then generates another result', () => {
        let done, value
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          value = result.value
        })
        it('should be done.', async () => {
          expect(done).toBe(true)
        })
        it('should yield no value.', async () => {
          expect(value).toBeUndefined()
        })
      })
    })
  })
  describe('consuming a stream with an empty string', () => {
    beforeEach(() => {
      // Note: this is different from the previous test which writes an empty
      // string to the stream. This test writes an empty buffer to the stream.
      // Both should behave the same but under the hood, this test returns an
      // empty buffer (!) while enumerating the stream whereas the previous test
      // returns no buffer at all. 
      stream = Readable.from(Buffer.alloc(0), 'utf8')
      generator = sip(stream)
    })
    describe('that generates a result', () => {
      let done, value, eof, decoder
      beforeEach(async () => {
        const result = await generator.next()
        done = result.done
        eof = result.value.eof
        decoder = result.value.decoder
      })
      it('should not be done.', async () => {
        expect(done).toBe(false)
      })
      it('should report end-of-file.', async () => {
        expect(eof).toBe(true)
      })
      it('should yield an empty decoder.', async () => {
        expect(decoder.toString()).toBe('')
      })
      describe('then generates another result', () => {
        let done, value
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          value = result.value
        })
        it('should be done.', async () => {
          expect(done).toBe(true)
        })
        it('should yield no value.', async () => {
          expect(value).toBeUndefined()
        })
      })
    })
  })
  describe('consuming a stream with a single character', () => {
    const char = '$'
    beforeEach(() => {
      stream.write(Buffer.from(char, 'utf8'))
      stream.end()
    })
    describe('that generates a result', () => {
      let done, value, eof, decoder
      beforeEach(async () => {
        const result = await generator.next()
        done = result.done
        eof = result.value.eof
        decoder = result.value.decoder
      })
      it('should not be done.', async () => {
        expect(done).toBe(false)
      })
      it('should not report end-of-file.', async () => {
        expect(eof).toBe(false)
      })
      it('should yield a decoder containing the character.', async () => {
        expect(decoder.toString()).toBe(char)
      })
      it('should not destroy the stream.', async () => {
        expect(stream.destroyed).toBe(false)
      })
      it('should not end the stream.', async () => {
        expect(stream.readableEnded).toBe(false)
      })
      describe('then generates another result', () => {
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          value = result.value
          eof = value.eof
          decoder = value.decoder
        })
        it('should not be done.', async () => {
          expect(done).toBe(false)
        })
        it('should report end-of-file.', async () => {
          expect(eof).toBe(true)
        })
        it('should yield the character.', async () => {
          expect(decoder.toString()).toBe(char)
        })
        describe('then generates another result', () => {
          beforeEach(async () => {
            const result = await generator.next()
            done = result.done
            value = result.value
          })
          it('should be done.', async () => {
            expect(done).toBe(true)
          })
          it('should yield no value.', async () => {
            expect(value).toBeUndefined()
          })
        })
      })
    })
    describe('that returns the readAll of the stream', async () => {
      let readAll
      beforeEach(async () => {
        readAll = await generator.readAll()
      })
      it('should return the char.', async () => {
        expect(readAll).toBe(char)
      })
      describe('then generates a result', () => {
        let done, value
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          value = result.value
        })
        it('should be done.', async () => {
          expect(done).toBe(true)
        })
        it('should yield no value.', async () => {
          expect(value).toBeUndefined()
        })
      })
    })
    describe('that is piped', () => {
      describe('into an owned pass-through stream', () => {
        let passThrough
        let text
        beforeEach(async () => {
          passThrough = new PassThrough()
          generator.pipe(passThrough)
          text = await toText(passThrough)
        })
        it('should pipe the character.', async () => {
          expect (text).toBe(char)
        })
        it('should destroy the stream.', async () => {
          expect(stream.destroyed).toBe(true)
        })
        describe('then generates a result', () => {
          let done, value
          beforeEach(async () => {
            const result = await generator.next()
            done = result.done
            value = result.value
          })
          it('should be done.', async () => {
            expect(done).toBe(true)
          })
          it('should yield no value.', async () => {
            expect(value).toBeUndefined()
          })
        })
      })
      describe('into a borrowed pass-through stream', () => {
        let passThrough
        beforeEach(async () => {
          passThrough = new PassThrough()
          generator.pipe(passThrough, { end: false })
        })
        it('should generate an chunk which is the char.', async () => {
          const generator = passThrough[Symbol.asyncIterator]()
          const { done, value } = await generator.next()
          expect(done).toBe(false)
          expect(value.toString()).toBe(char)
        })
        it('should not destroy the stream.', async () => {
          expect(stream.destroyed).toBe(false)
        })
      })
    })
  })
  describe('consuming a stream when two characters written', () => {
    const chars = ['a', 'b', 'c']
    beforeEach(() => {
      stream.write(Buffer.from(chars[0], 'utf8'))
      stream.write(Buffer.from(chars[1], 'utf8'))
    })
    describe('that generates a result', () => {
      let done, eof, decoder
      beforeEach(async () => {
        const result = await generator.next()
        done = result.done
        eof = result.value.eof
        decoder = result.value.decoder
      })
      it('should not be done.', async () => {
        expect(done).toBe(false)
      })
      it('should not report end-of-file.', async () => {
        expect(eof).toBe(false)
      })
      it('should yield a decoder containing the first chunk.', async () => {
        expect(decoder.toString()).toBe(chars[0])
      })
      it('should not destroy the stream.', async () => {
        expect(stream.destroyed).toBe(false)
      })
      it('should not end the stream.', async () => {
        expect(stream.readableEnded).toBe(false)
      })
      describe('then destroys the stream', () => {
        beforeEach(() => {
          stream.destroy()
        })
        it('should destroy the stream.', async () => {
          expect(stream.destroyed).toBe(true)
        })
        it('should not be readableEnded.', async () => {
          expect(stream.readableEnded).toBe(false)
        })
        describe('then generates another result', async () => {
          let done, value, eof, decoder
          beforeEach(async () => {
            const result = await generator.next()
            done = result.done
            value = result.value
            eof = value.eof
            decoder = value.decoder
          })
          it('should not be done.', async () => {
            expect(done).toBe(false)
          })
          it('should not report end-of-file.', async () => {
            expect(eof).toBe(false)
          })
          it('should yield a decoder containing the second character.', async () => {
            expect(decoder.toString()).toBe(chars[0] + chars[1])
          })
          describe('then promises to generate another result', () => {
            let promise
            beforeEach(() => {
              promise = generator.next()
            })
            it('throw an error.', async () => {
              await expect(promise).rejects.toThrow('Premature close')
            })
          })
        })
        describe('then promises to return readAll', async () => {
          let promise
          beforeEach(async () => {
            promise = generator.readAll()
          })
          it('should throw an error.', async () => {
            await expect(promise).rejects.toThrow('Premature close')
          })
        })
      })
      describe('then generates another result', () => {
        beforeEach(async () => {
          const result = await generator.next()
          done = result.done
          eof = result.value.eof
          decoder = result.value.decoder
        })
        it('should not be done.', async () => {
          expect(done).toBe(false)
        })
        it('should not report end-of-file.', async () => {
          expect(eof).toBe(false)
        })
        it('should yield a decoder containing the first two chars.', async () => {
          expect(decoder.toString()).toBe(chars[0] + chars[1])
        })
      })
      describe('then another character is written', () => {
        beforeEach(() => {
          stream.write(Buffer.from(chars[2], 'utf8'))
        })
        describe('and ends the stream', () => {
          beforeEach(() => {
            stream.end()
          })
          describe('and pipes the stream into a pass-through stream', () => {
            let passThrough
            let text
            beforeEach(async () => {
              passThrough = new PassThrough()
              generator.pipe(passThrough)
              text = await toText(passThrough)
            })
            it('should pipe all three characters.', async () => {
              expect(text).toBe(chars[0] + chars[1] + chars[2])
            })
            it('should destroy the stream.', async () => {
              expect(stream.destroyed).toBe(true)
            })
            describe('then reads the readAll of the stream', () => {
              let readAll
              beforeEach(async () => {
                readAll = await generator.readAll()
              })
              it('should return an empty string.', async () => {
                expect(readAll).toBe('')
              })
            })
            describe('then generates a result', () => {
              let done, value
              beforeEach(async () => {
                const result = await generator.next()
                done = result.done
                value = result.value
              })
              it('should be done.', async () => {
                expect(done).toBe(true)
              })
              it('should yield no value.', async () => {
                expect(value).toBeUndefined()
              })
            })
          })
          describe('and returns the readAll of the stream', async () => {
            let readAll
            beforeEach(async () => {
              readAll = await generator.readAll()
            })
            it('should return all three characters.', async () => {
              expect(readAll).toBe(chars[0] + chars[1] + chars[2])
            })
            describe('then pipes into a pass-through stream', () => {
              let passThrough
              let text
              beforeEach(async () => {
                passThrough = new PassThrough()
                generator.pipe(passThrough)
                text = await toText(passThrough)
              })
              it('should return an empty pipe.', async () => {
                expect(text).toBe('')
              })
              it('should destroy the stream.', async () => {
                expect(stream.destroyed).toBe(true)
              })
            })
            describe('then generates a result', () => {
              let done, value
              beforeEach(async () => {
                const result = await generator.next()
                done = result.done
                value = result.value
              })
              it('should be done.', async () => {
                expect(done).toBe(true)
              })
              it('should yield no value.', async () => {
                expect(value).toBeUndefined()
              })
            })
          })
        })
        describe('then generates another result', () => {
          let done, value, eof, decoder
          beforeEach(async () => {
            await generator.next()
            const result = await generator.next()
            done = result.done
            value = result.value
            eof = value.eof
            decoder = value.decoder
          })
          it('should not be done.', async () => {
            expect(done).toBe(false)
          })
          it('should not report end-of-file.', async () => {
            expect(eof).toBe(false)
          })
          it('should yield a decoder containing all three characters.', async () => {
            expect(decoder.toString()).toBe(chars[0] + chars[1] + chars[2])
          })
        })
        describe('then consumes the decoder', () => {
          let sippedText
          beforeEach(() => {
            sippedText = decoder.toString()
            decoder.clear()
          })
          it('should not destroy the stream.', async () => {
            expect(stream.destroyed).toBe(false)
          })
          it('should not end the stream.', async () => {
            expect(stream.readableEnded).toBe(false)
          })
          it('should have sipped the first character.', async () => {
            expect(sippedText).toBe(chars[0])
          })
          it('should have an empty decoder.', async () => {
            expect(decoder.toString()).toBe('')
          })
          describe('and ends the stream', () => {
            beforeEach(() => {
              stream.end()
            })
            describe('then returns the readAll of the stream', async () => {
              let readAll
              beforeEach(async () => {
                readAll = await generator.readAll()
              })
              it('should return the second and third characters.', async () => {
                expect(readAll).toBe(chars[1] + chars[2])
              })
            })
            describe('then pipes into a pass-through stream', () => {
              let passThrough
              let text
              beforeEach(async () => {
                passThrough = new PassThrough()
                generator.pipe(passThrough)
                text = await toText(passThrough)
              })
              it('should pipe the second and third characters.', async () => {
                expect(text).toBe(chars[1] + chars[2])
              })
            })
          })
        })
      })
    })
  })
  describe('consuming a stream with 2 byte multibyte character', () => {
    const twoByteUnicodeChar = '¢'
    const buffer = Buffer.from(twoByteUnicodeChar, 'utf8')
    const byte0 = buffer.slice(0, 1)
    const byte1 = buffer.slice(1, 2)
    it('should be a 2 byte character.', () => {
      expect(buffer.length).toBe(2)
    })
    describe('that writes the first byte', () => {
      beforeEach(() => {
        stream.write(byte0)
      })
      describe('then ends the stream', () => {
        beforeEach(() => {
          stream.end()
        })
        describe('then promises to generate a result', () => {
          let promise
          beforeEach(async () => {
            promise = generator.next()
          })
          it('should throw an error.', async () => {
            await expect(promise).rejects.toThrow(
              'Stream ended before a character boundary was found.')
          })
        })
      })
      describe('and generates a promise for the next value', () => {
        let promise
        beforeEach(() => {
          promise = generator.next()
        })
        it('should hang for 25ms.', async () => {
          const timeout = sleep(25).then(() => true)
          const timein = promise.then(() => false)
          expect(await Promise.any([timeout, timein])).toBe(true)
        })
      })
      describe('and then writes the second byte', () => {
        beforeEach(() => {
          stream.write(byte1)
        })
        describe('and ends the stream', () => {
          beforeEach(() => {
            stream.end()
          })
          describe('then generates a result', () => {
            let done, value, eof, decoder
            beforeEach(async () => {
              const result = await generator.next()
              done = result.done
              value = result.value
              eof = value.eof
              decoder = value.decoder
            })
            it('should not be done.', async () => {
              expect(done).toBe(false)
            })
            it('should not report end-of-file.', async () => {
              expect(eof).toBe(false)
            })
            it('should yield a decoder containing the character.', async () => {
              expect(decoder.toString()).toBe(twoByteUnicodeChar)
            })
            describe('then generates another result', () => {
              let done, value
              beforeEach(async () => {
                const result = await generator.next()
                done = result.done
                value = result.value
              })
              it('should not be done.', async () => {
                expect(done).toBe(false)
              })
              it('should report end-of-file.', async () => {
                expect(value.eof).toBe(true)
              })
            })
          })
          describe('then returns the readAll of the stream', async () => {
            let readAll
            beforeEach(async () => {
              readAll = await generator.readAll()
            })
            it('should return the character.', async () => {
              expect(readAll).toBe(twoByteUnicodeChar)
            })
          })
          describe('then pipes into a pass-through stream', () => {
            let passThrough
            let text
            beforeEach(async () => {
              passThrough = new PassThrough()
              generator.pipe(passThrough)
              text = await toText(passThrough)
            })
            it('should pipe the character.', async () => {
              expect(text).toBe(twoByteUnicodeChar)
            })
          })
        })
      })
    })
  })
  describe('consuming a stream that is hung', () => {
    beforeEach(() => {
      stream = new Readable({ read() { } })
      generator = sip(stream)
    })
    it('should hang for 25ms.', async () => {
      const timeout = sleep(25).then(() => true)
      const timein = generator.next().then(() => false)
      expect(await Promise.any([timeout, timein])).toBe(true)
    })
    describe('that is disposed', () => {
      beforeEach(async () => {
        await generator.dispose()
      })
      it('should destroy the stream.', () => {
        expect(stream.destroyed).toBe(true)
      })
      describe('that promises to generate a result', () => {
        let promise
        beforeEach(() => {
          promise = generator.next()
        })
        it('should throw an error.', async () => {
          await expect(promise).rejects.toThrow('Premature close')
        })
      })
      describe('that promises to return the readAll of the stream', () => {
        let promise
        beforeEach(() => {
          promise = generator.readAll()
        })
        it('should throw an error.', async () => {
          await expect(promise).rejects.toThrow('Premature close')
        })
      })
    })
  })
})
