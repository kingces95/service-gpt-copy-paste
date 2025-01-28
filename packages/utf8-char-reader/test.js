import Utf8CharReader from '@kingjs/utf8-char-reader';
import assert from 'assert';

// Test cases for Utf8CharReader
const testCases = [
  {
    description: 'Single-byte ASCII characters',
    input: Buffer.from('hello'),
    expected: 'hello'
  },
  {
    description: 'Two-byte UTF-8 characters',
    input: Buffer.from([0xc3, 0xa9]), // "é"
    expected: 'é'
  },
  {
    description: 'Three-byte UTF-8 characters',
    input: Buffer.from([0xe2, 0x82, 0xac]), // "€"
    expected: '€'
  },
  {
    description: 'Four-byte UTF-8 characters',
    input: Buffer.from([0xf0, 0x9f, 0x98, 0x81]), // "😁"
    expected: '😁'
  },
  // {
  //   description: 'Mixed ASCII and UTF-8 characters',
  //   input: Buffer.from('hello Ã    input: Buffer.from('hello \xc3©    input: Buffer.from('hello \xc3\xa9 â    input: Buffer.from('hello \xc3\xa9 \xe2    input: Buffer.from('hello \xc3\xa9 \xe2\x82¬    input: Buffer.from('hello \xc3\xa9 \xe2\x82\xac ð    input: Buffer.from('hello \xc3\xa9 \xe2\x82\xac \xf0    input: Buffer.from('hello \xc3\xa9 \xe2\x82\xac \xf0\x9f    input: Buffer.from('hello \xc3\xa9 \xe2\x82\xac \xf0\x9f\x98    input: Buffer.from('hello \xc3\xa9 \xe2\x82\xac \xf0\x9f\x98\x81'),
  //   expected: 'hello é € 😁'
  // },
  {
    description: 'Incomplete multi-byte character',
    input: Buffer.from([0xf0, 0x9f, 0x98]), // Incomplete "😁"
    expected: new Error('Incomplete character')
  },
];

// Run tests
for (const { description, input, expected } of testCases) {
  const reader = new Utf8CharReader();
  let result = '';
  let error = null;

  try {
    for (const byte of input) {
      if (reader.processByte(byte)) {
        result += reader.toString();
      }
    }

    // Handle remaining buffer
    if (reader.buffer.length > 0) {
      throw new Error('Incomplete character');
    }
  } catch (err) {
    error = err;
  }

  console.log(`Running test: ${description}`);

  if (expected instanceof Error) {
    assert(error, 'Expected an error but none was thrown');
    assert.strictEqual(error.message, expected.message, `Expected error message: ${expected.message}`);
  } else {
    assert.strictEqual(result, expected, `Expected: "${expected}" but got: "${result}"`);
  }

  console.log('Test passed!\n');
}
