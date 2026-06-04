# Generic

Working sketch for a closure-based generic type helper.

```js
export const MyGenericClass = generic(
  'MyGenericClass',
  ['TFoo'],
  ({ TFoo }) => {
    return class MyGenericClass extends BaseClass {
      static get fooType() { return TFoo }

      get value() {
        return new TFoo()
      }
    }
  }
)

export const MyStringClass = MyGenericClass.of(String)
export const MyNumberClass = MyGenericClass.of(Number)
```

The generic body is a function so type arguments are in lexical scope while the
class is constructed. That lets generic bases be expressed directly:

```js
export const DerivedGeneric = generic(
  'DerivedGeneric',
  ['TFoo'],
  ({ TFoo }) => {
    return class DerivedGeneric extends MyGenericClass.of(TFoo) {
      static get derivedFooType() { return TFoo }
    }
  }
)
```

Approximate helper:

```js
function generic(name, parameterNames, body) {
  const cache = new Map()

  function keyOf(args) {
    return args.map(arg => arg?.name ?? String(arg)).join(',')
  }

  return {
    of(...args) {
      const key = keyOf(args)
      if (cache.has(key))
        return cache.get(key)

      const parameters = Object.freeze(Object.fromEntries(
        parameterNames.map((name, index) => [name, args[index]])
      ))

      const type = body(parameters)
      Object.defineProperty(type, 'name', {
        value: `${name}<${args.map(arg => arg.name).join(', ')}>`,
        configurable: true,
      })

      cache.set(key, type)
      return type
    },
  }
}
```

Vector sketch:

```js
export const Vector = generic(
  'Vector',
  ['TSpan'],
  ({ TSpan }) => {
    return class Vector extends PartialProxy {
      static cursorType = ContiguousCursor
      static get spanType() { return TSpan }
      static get valueType() { return Number }
      static get defaultValue() { return 0 }
      static get bytesPerValue() { return TSpan.BYTES_PER_ELEMENT }

      constructor(capacity = 8) {
        super()
        this._size = 0
        this._bytes = new ArrayBuffer(capacity * this.constructor.bytesPerValue)
        this._buffer = new Lazy(() => new this.spanType(this._bytes))
      }
    }
  }
)

export const Uint8Vector = Vector.of(Uint8Array)
export const Float64Vector = Vector.of(Float64Array)
```

Open fork:

```txt
Option A
├─ Vector is generic
└─ Uint8Vector = Vector.of(Uint8Array)

Option B
├─ Vector is default specialization
└─ VectorGeneric.of(...) creates other specializations
```
