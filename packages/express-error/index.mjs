// Define the base ExpressError class
export default class ExpressError extends Error {
  constructor(code, message) {
    super(message || 'Unknown Error');
    this.code = code;
  }
}
