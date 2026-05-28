export class Tuple extends Array {
  static of(...values) {
    return Object.freeze(new Tuple(...values))
  }
}
