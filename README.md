yield-callback - run async/callback functions in a sync style, with generators
================================================================================

This library makes it easy to write code that makes serial calls to async
functions that use callbacks in the typical "Node.js" style - eg, `cb(err, data)`.
Forget the [Callback Hell][] - and write code that looks like it's synchronous,
but isn't.  Thanks to the magic that is [JavaScript Generators][].



[Callback Hell]:         http://callbackhell.com/
[JavaScript Generators]: https://davidwalsh.name/es6-generators

example
================================================================================

Say you want to write a function `readFile()` which reads the contents of a file
using the `fs` module.  Here's how you would do it using Node.js's low-level
`fs` module functions, in a fairly typical pyramid-of-callback-hell-doom:

```js
function readFile (fileName, cb) {
  fs.open(fileName, 'r', function (err, fd) {
    if (err) return cb(err)

    fs.fstat(fd, function (err, stats) {
      if (err) return cb(err)

      const buffer = new Buffer(stats.size)

      fs.read(fd, buffer, 0, buffer.length, 0, function (err, bytesRead, bufferRead) {
        if (err) return cb(err)
        if (bytesRead !== buffer.length) return cb(new Error('EMOREFILE'))

        fs.close(fd, function (err) {
          if (err) return cb(err)

          cb(null, bufferRead)
        })
      })
    })
  })
}
```

With `yield-callback`, you can write it like this instead:

```js
function * readFileGen (fileName, cb) {
  const fd = yield fs.open(fileName, 'r', cb)
  if (cb.err) return cb.err

  const stats = yield fs.fstat(fd, cb)
  if (cb.err) return cb.err

  const buffer = new Buffer(stats.size)

  const bytesReadBuffer = yield fs.read(fd, buffer, 0, buffer.length, 0, cb)
  if (cb.err) return cb.err

  const bytesRead = bytesReadBuffer[0]
  const bufferRead = bytesReadBuffer[1]
  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  yield fs.close(fd, cb)
  if (cb.err) return cb.err

  return bufferRead
}
```

Your `readFile()` function will actually be implemented as a generator function.
Note the generator function takes a `cb` parameter at the end, but it it works
differently than a typical Node.js callback.  You pass that `cb` parameter as
the callback for async functions called inside the generator function, used
within yield expressions, and `cb` arranges to yield the callback 'result'
argument(s) as the result, and sets the 'error' argument to `cb.err`:

You can then invoke the generator as below.  Note that you pass a "normal"
callback function in as the final parameter to `run()`, which will be invoked
when the generator finally returns.  If the generator returns an error, the
first argument will be that error.  Otherwise, the second argument will be set
to the return value.  Just like a typical Node.js async callback:

```js
yieldCallback.run(readFileGen, fileName, function (err, buffer) {
  if (err) console.log(err)
  else console.log(buffer.toString('utf8'))
})
```

Or you can wrap the generator to return a "typical errback" function; in this
case, with the same signature and behavior as the pyramid-of-doom `readFile()`
above:

```js
const readFile = yieldCallback(readFileGen)

readFile(fileName, function (err, buffer) {
  if (err) console.log(err)
  else console.log(buffer.toString('utf8'))
})
```

install
================================================================================

    npm install yield-callback


API
================================================================================

This module exports a function which takes a generator function as a parameter
and returns a new function with the same signature as the generator function.
For the remainder of this document, we'll refer to this function as
`yieldCallback()`, as if you had done a:

```js
const yieldCallback = require('yield-callback')
```

The returned function takes a callback which will be invoked when the generator
returns.  The generator itself gets passed a `cb` argument as it's final
parameter, which should be passed as the "callback" function on any async calls
that you make, which you should use as expressions in front of a `yield`:

```js
function * myGenerator(a, b, cb) {
  console.log('waiting(a)', a, 'ms')
  yield setTimeout(cb, a)

  console.log('waiting(b)', b, 'ms')
  yield setTimeout(cb, b)

  return a + b
}

const myWrapped = yieldCallback(myGenerator)

myWrapped(1000, 2000, function (err, val) {
  console.log('should be 3000:', val)
})
```

You can also run a generator directly, via the `run` function available on the
exported function (eg, `yieldCallback.run()`).

The following are equivalent:

```js
yieldCallback.run(generatorFunction, arg1, arg2, ... callback)
```

is equivalent to

```js
const wrapped = yieldCallback(generatorFunction)
wrapped(arg1, arg2, ... callback)
```


### API within the generator function

When the generator function is invoked, it's final argument is a special
callback function to be used with async callback functions called within the
generator.  This function can be used as the callback function in an async
callback function, if the function is used in a `yield` expression:

```js
function * genFunction(a, b, cb) {
  ...
  yield setTimeout(cb, 1000)

  // code following this comment won't run for 1000 milliseconds
  ...
}
```

The `yield` expression returns a value, which is the "result" passed to the
callback.  The "error" passed to the callback is available as `cb.err`.

```js
function * genFunction(fileName, cb) {
  // fs.readFile()'s cb: (err, fileContents)
  const fileContents = yield fs.readFile(fileName, 'utf8', cb)

  // the `err` argument of the callback is available in `cb.err`
  if (cb.err) return cb.err

  console.log(fileContents) // print the file contents
}
```

If the callback is invoked with a non-null first argument, eg `cb(err)`, the
result will be `null`, and `cb.err` will be set to that argument.

If the callback is invoked with a single response value, eg `cb(null, 1)`, the
result will be the single response value, and `cb.err` will be `null`.

If the callback is invoked with multiple response values, eg, `cb(null, 1, 2)`,
the result will be an array of the response values, eg `[1, 2]`, and `cb.err`
will be `null`.

The value that the generator finally returns will be passed to the original
callback back passed into the wrapped (or run) function.  That callback should
have the signature `cb(err, data)`.

If the generator returns an instance of Error, the callback will be invoked with
that error as the first parameter.

If the generator return anything else, the callback will be invoked with a null
error, and that returned object as the second parameter.

In case you're not sure, or know, that the `err` object you want to return from
a generator **isn't** an instance of Error, you can use the function
`cb.errorResult()` to wrap your object so that it will be treated as an error
result, rather than a non-error object passed as the second callback parameter:


```js
yieldCallback.run(genFunction, aFileName, function outerCB (err, data) {})

function * genFunction(fileName, cb) {
  const data = yield fs.readFile(fileName, 'utf8', cb)

  if (cb.err) return cb.err                  // calls outerCB(err)

  if (cb.err) return cb.errorResult(cb.err)  // also calls outerCB(err),
                                             // even if `cb.err` isn't an
                                             // instance of Error

  return data                                // calls outerCB(null, data)
}
```
