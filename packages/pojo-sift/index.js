export function* siftPojos(records, filters) {
  const list = Array.isArray(filters) ? filters : [filters]

  for (const record of records) {

    filterLoop: for (const filter of list) {

      for (const key in filter) {
        const recordValue = record[key] ?? false
        const filterValue = filter[key]
        if (recordValue != filterValue) 
          continue filterLoop
      }

      yield record
      break
    }
  }
}
