// Thunks use this to indicate the descriptor targets an abstract member.
// TODO: Have Thunks use this 
export const IsAbstract = Symbol('isAbstract')

export function abstract() {
  throw new Error('Abstract member not implemented')
}

export { 
  abstract as get, 
  abstract as set, 
  abstract as value 
}

export function isAbstract(descriptor) {
  if (!descriptor) return false
  if (descriptor[IsAbstract]) return true
  if (descriptor.get === abstract) return true
  if (descriptor.set === abstract) return true
  if (descriptor.value === abstract) return true
  return false
}
