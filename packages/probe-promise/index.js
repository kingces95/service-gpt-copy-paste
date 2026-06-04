import { Probe } from '@kingjs/probe'

export class PromiseProbe extends Probe {
  then() { }
  catch() { }
  finally() { }
}

export class ThenableProbe extends Probe {
  then() { }
}
