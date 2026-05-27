# Cover Container Surface

This checkin closes the coverage loop for the container surface: concrete
containers, their cursors, and the Parts they compose are exercised through
public behavior wherever that behavior exists.

The testing invariant is:

```txt
container behavior
├─ prefer public container calls
├─ cover cursor specializations explicitly
└─ cover inert declarations with cover(...)
```

`cover(...)` is for declaration stubs that intentionally have no runtime body.
Computed abstract defaults are left as comments so coverage can invoke the
declaration without accidentally running semantic default logic:

```js
erase(first, last /* = next(first) */) { }
resize(count, value /* = this.defaultValue$ */) { }
```

The debug-pipeline invariant is:

```txt
ArgChecks verify positional argument shape.
Preconditions and Transforms may assume ArgChecks have done that work.
```

That keeps transforms such as `sourceRange` focused on their real job: snapshot
source-overlap ranges after the argument layer has accepted the range shape.
Bad range arguments are tested through public container calls and fail at the
argument-check layer.

The ownership invariant sharpened by coverage is:

```txt
Concepts declare shared vocabulary.
Parts host checked/debug behavior.
Concrete containers compose Parts and specialize cursors.
```

Coverage exposed duplicate or misplaced fallback behavior, such as
`ContainerPart.cursorType`, which belongs to `RangeConcept`. The resulting shape
keeps declaration vocabulary, debug assertions, argument transforms, and
concrete cursor/container behavior in their own homes.
