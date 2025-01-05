export default class Utf8CharReader {
  constructor() {
    this.buffer = []; // Buffer for partial character bytes
    this.expectedBytes = 0; // Number of bytes needed for a full character
    this.charCount = 0; // Tracks the number of complete characters processed
  }

  static determineExpectedBytes(byte) {
    // Determine the number of bytes based on the first byte
    if ((byte & 0b10000000) === 0) {
      return 1; // Single-byte character
    } else if ((byte & 0b11100000) === 0b11000000) {
      return 2; // Two-byte character
    } else if ((byte & 0b11110000) === 0b11100000) {
      return 3; // Three-byte character
    } else if ((byte & 0b11111000) === 0b11110000) {
      return 4; // Four-byte character
    } else {
      throw new Error('Invalid UTF-8 byte');
    }
  }

  processByte(byte) {
    if (this.expectedBytes === 0) {
      this.expectedBytes = Utf8CharReader.determineExpectedBytes(byte);
    }

    // Add the byte to the buffer
    this.buffer.push(byte);

    // Check if the buffer now contains a full character
    if (this.buffer.length === this.expectedBytes) {
      this.charCount++; // Increment the character count
      this.expectedBytes = 0; // Reset state for the next character
      return true; // Signal that a full character was processed
    }

    return false; // Not enough bytes yet
  }

  toString() {
    const result = Buffer.from(this.buffer).toString('utf8');
    this.buffer = []; // Clear the buffer after converting to string
    return result;
  }
}