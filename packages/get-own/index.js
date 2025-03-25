export function getOwn(target, name) { 
  return Object.hasOwn(target, name) ? target[name] : undefined 
}