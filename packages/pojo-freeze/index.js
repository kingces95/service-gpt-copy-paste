export function pojoFreeze(target) {
  if (target === null || typeof target !== 'object') 
    return target

  for (const key in target) {
    const value = target[key]
    if (value && typeof value === 'object') 
      deepFreeze(value)
  }

  return Object.freeze(target)
}
