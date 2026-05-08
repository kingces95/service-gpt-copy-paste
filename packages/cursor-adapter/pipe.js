//_____________________________________________________________________________
// PIPE

// Applies adapters to a range in sequence. The output of one adaptor is the input 
// of the next. For example, to take 3 from an infinite range, you can do:

//    pipe(
//      repeatRange(42),
//      take(3)
//    )

// The above example is equivalent to:

//    take(repeatRange(42), 3)

// The first argument returns a range. The rest of the arguments are adaptors that 
// take a range and return a range. In general, the pattern for adaptors is:

//    function adaptor(...args) {
//      return (range) => new RangeAdaptor(range, ...args)
//    }

export function pipe(range, ...adaptors) {
  for (const adaptor of adaptors)
    range = adaptor(range)

  return range
}
