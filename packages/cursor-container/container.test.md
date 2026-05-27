# Container Test Shape

```txt
A [Container]
├─ type should
│  ├─ implement its expected concepts
│  ├─ implement only its expected concepts
│  ├─ satisfy its expected range probes
│  ├─ define its expected members
│  └─ expose its expected cursor type
├─ should
│  ├─ when empty
│  │  ├─ have cursors distinct from another container
│  │  ├─ have a Uint8Array span
│  │  ├─ be empty
│  │  ├─ have equal begin cursors
│  │  ├─ have equal end cursors
│  │  ├─ have begin equal to end
│  │  ├─ report size 0
│  │  ├─ have capacity greater than 0
│  │  └─ have span length 0
│  ├─ manage capacity
│  │  ├─ keep capacity when reserving current capacity
│  │  └─ double capacity when reserving one more capacity
│  ├─ when populated with
│  │  ├─ insert
│  │  │  ├─ have equal begin cursors
│  │  │  ├─ have equal end cursors
│  │  │  ├─ have begin distinct from end
│  │  │  ├─ report size 1
│  │  │  ├─ have capacity greater than 1
│  │  │  ├─ have span length 1
│  │  │  ├─ not be empty
│  │  │  ├─ have value at index 0
│  │  │  ├─ set value at index 0
│  │  │  ├─ read value at index 0
│  │  │  ├─ have span matching the value
│  │  │  ├─ contain the key
│  │  │  └─ get the value by key
│  │  ├─ insertOrAssign
│  │  ├─ pushFront
│  │  ├─ pushBack
│  │  ├─ insertValue
│  │  ├─ insertValueAfter
│  │  ├─ insertRange
│  │  ├─ insertRangeAfter
│  │  ├─ assignRange
│  │  ├─ assign
│  │  └─ resize
│  └─ when depopulated with
│     ├─ popBack
│     │  ├─ return the value
│     │  ├─ be empty
│     │  ├─ have equal begin cursors
│     │  ├─ have equal end cursors
│     │  ├─ have begin equal to end
│     │  ├─ report size 0
│     │  ├─ have capacity greater than 0
│     │  └─ have span length 0
│     ├─ popFront
│     ├─ clear
│     ├─ erase
│     └─ resize
└─ asserts
   ├─ when empty then calls
   │  ├─ step
   │  ├─ stepBack before begin
   │  ├─ popFront
   │  ├─ at
   │  ├─ setAt
   │  └─ readAt
   ├─ when a non-source range is passed to
   │  ├─ assignRange
   │  ├─ insertRange
   │  ├─ insertRangeAfter
   │  ├─ replaceRange
   │  └─ replaceRangeAfter
   ├─ when its own range is passed to
   │  ├─ assignRange
   │  ├─ insertRange
   │  ├─ insertRangeAfter
   │  ├─ replaceRange
   │  └─ replaceRangeAfter
   ├─ when insertValue receives
   │  ├─ a null cursor
   │  ├─ a cursor from another container
   │  └─ an out-of-bounds cursor
   ├─ when insertValueAfter receives
   │  ├─ a null cursor
   │  ├─ a cursor from another container
   │  └─ an out-of-bounds cursor
   ├─ when erase receives
   │  ├─ a null last cursor
   │  └─ a reversed cursor pair
   └─ when eraseAfter receives
      └─ a null last cursor
```
