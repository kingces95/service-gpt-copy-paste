import { trimPojo } from "@kingjs/pojo-trim"

function pivotPojo(pojo, pivotsMd, pivot) {

  for (const key of Reflect.ownKeys(pivotsMd)) {
    const pivotMd = pivotsMd[key]
    const { predicate, type } = pivotMd
    if (predicate) {
      if (!pojo[predicate]) continue
      delete pojo[predicate]
    }
    if (type) {
      if (pojo.type != type) continue
      // delete pojo.type
    }
    
    const nextPivot = pivot[key] ??= { }

    // base case
    if (!('pivot' in pivotMd)) {
      const { name } = pojo
      nextPivot[name] = pojo
      delete pojo.name
      return
    }

    // recursive case
    return pivotPojo(pojo, pivotMd.pivot, nextPivot)
  }
}

function pivotSkeleton(pivotsMd, pivot = { }) {
  for (const key of Reflect.ownKeys(pivotsMd)) {
    const pivotMd = pivotsMd[key]
    const subPivot = pivot[key] = { }

    const subPivotMd = pivotMd.pivot
    if (subPivotMd)
      pivotSkeleton(subPivotMd, subPivot)
  }
  return pivot
}

export function pivotPojos(pojos, metadata) {
  const pivot = pivotSkeleton(metadata)
  for (const pojo of pojos)
    pivotPojo({ ...pojo }, metadata, pivot)
  return trimPojo(pivot)
}