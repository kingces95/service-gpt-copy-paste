export function isPojo(value) {
  return value 
    && typeof value === 'object' 
    && !Array.isArray(value) 
    && value.constructor === Object
}