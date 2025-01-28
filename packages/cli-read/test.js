import fs from 'fs'
import Input from './index.js'

async function testRead() {
  const filePath = './test-file.txt'
  fs.writeFileSync(filePath, 'Hello, World!\nThis is a  test.')

  const fd = fs.openSync(filePath, 'r')
  const input = new Input(fd)

  const result1 = await input.readRecord(['a','b'])
  const result2 = await input.readRecord(['a','b', 'c'])
  // const result = await input.read(5)
  // console.assert(result === 'Hello', `Expected 'Hello', but got '${result}'`)

  fs.closeSync(fd)
  fs.unlinkSync(filePath)
  console.log('testRead passed.')
}

testRead()
