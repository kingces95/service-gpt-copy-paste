import fs from 'fs';
import os from 'os';
import { Writable } from 'stream';

class StreamNull extends Writable {
  constructor() {
    super({ write(chunk, encoding, callback) { callback(); } });
  }
}

const devNullPath = os.platform() === 'win32' ? 'NUL' : '/dev/null';

export const streamNull = fs.createWriteStream(devNullPath);
export default StreamNull;
