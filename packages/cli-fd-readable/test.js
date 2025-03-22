import fs from 'fs';
import Input from './index.js';

async function testRead() {
  const filePath = './test-file.txt';
  fs.writeFileSync(filePath, 'Hello, World!\nThis is a test.\nKey1:Value1 Key2:Value2\n');

  const fd = fs.openSync(filePath, 'r');
  const input = new Input(fd, ' ');

  // Test reading a record with two fields
  const result1 = await input.readRecord(['a', 'b']);
  console.assert(
    JSON.stringify(result1) === JSON.stringify({ a: 'Hello,', b: 'World!' }),
    `Expected { a: 'Hello,', b: 'World!' }, but got ${JSON.stringify(result1)}`
  );

  // Test reading a record with three fields
  const result2 = await input.readRecord(['a', 'b', 'c']);
  console.assert(
    JSON.stringify(result2) === JSON.stringify({ a: 'This', b: 'is', c: 'a' }),
    `Expected { a: 'This', b: 'is', c: 'a' }, but got ${JSON.stringify(result2)}`
  );

  // Test reading a fixed number of characters
  const result3 = await input.readString(5);
  console.assert(
    result3 === 'test.',
    `Expected 'test.', but got '${result3}'`
  );

  // Test reading a line
  const result4 = await input.readLine();
  console.assert(
    result4 === 'Key1:Value1 Key2:Value2',
    `Expected 'Key1:Value1 Key2:Value2', but got '${result4}'`
  );

  fs.closeSync(fd);
  fs.unlinkSync(filePath);
  console.log('All tests passed.');
}

testRead();
