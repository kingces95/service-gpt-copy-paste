export const jmespathFn = {
  // Sorting and Ordering Functions
  sort_by: {
    _func: (resolvedArgs) => resolvedArgs[0].sort((a, b) => (a[resolvedArgs[1]] > b[resolvedArgs[1]] ? 1 : -1)),
    _signature: [{}, {}]
  },
  reverse: {
    _func: (resolvedArgs) => resolvedArgs[0].slice().reverse(),
    _signature: [{}]
  },
  unique: {
    _func: (resolvedArgs) => [...new Set(resolvedArgs[0])],
    _signature: [{}]
  },

  // String Manipulation Functions
  join: {
    _func: (resolvedArgs) => resolvedArgs[1].join(resolvedArgs[0]),
    _signature: [{}, {}]
  },
  split: {
    _func: (resolvedArgs) => resolvedArgs[1].split(resolvedArgs[0]),
    _signature: [{}, {}]
  },

  // Aggregation Functions
  min_by: {
    _func: (resolvedArgs) => resolvedArgs[0].reduce((min, item) => (item[resolvedArgs[1]] < min[resolvedArgs[1]] ? item : min), resolvedArgs[0][0]),
    _signature: [{}, {}]
  },
  max_by: {
    _func: (resolvedArgs) => resolvedArgs[0].reduce((max, item) => (item[resolvedArgs[1]] > max[resolvedArgs[1]] ? item : max), resolvedArgs[0][0]),
    _signature: [{}, {}]
  },

  // Type Conversion Functions
  to_string: {
    _func: (resolvedArgs) => String(resolvedArgs[0]),
    _signature: [{}]
  },
  to_number: {
    _func: (resolvedArgs) => Number(resolvedArgs[0]),
    _signature: [{}]
  },

  // Object Operations
  keys: {
    _func: (resolvedArgs) => Object.keys(resolvedArgs[0]),
    _signature: [{}]
  },
  values: {
    _func: (resolvedArgs) => Object.values(resolvedArgs[0]),
    _signature: [{}]
  },

  // Utility Functions
  not_null: {
    _func: (resolvedArgs) => resolvedArgs.find(val => val !== null && val !== undefined) || null,
    _signature: [{}, {}]
  },
  group_by: {
    _func: (resolvedArgs) => {
      const [array, key] = resolvedArgs;
      return array.reduce((acc, item) => {
        const groupKey = item[key] || "unknown";
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
      }, {});
    },
    _signature: [{}, {}]
  }
}