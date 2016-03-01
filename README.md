yield-callback - run async/callback functions in a sync style, with generators
================================================================================

Run asynchronous/callback functions in a synchronous style, inside a generator.


example
================================================================================

Say you want to write a function `readFile()` which reads the contents of a file
using the `fs` module.  Here's how you would do it using a pyramid of doom:

```js
// calling the readFile() function
readFile(fileName, function (err, buffer) {
  if (err) console.log(err)
  else console.log(buffer.toString('utf8'))
})

// implementation of the readFile() function
function readFile (fileName, cb) {
  fs.open(fileName, 'r', function (err, fd) {
    if (err) return cb(err)

    fs.fstat(fd, function (err, stats) {
      if (err) return cb(err)

      const buffer = new Buffer(stats.size)

      fs.read(fd, buffer, 0, buffer.length, 0, function (err, bytesRead) {
        if (err) return cb(err)
        if (bytesRead !== buffer.length) return cb(new Error('EMOREFILE'))

        fs.close(fd, function (err) {
          if (err) return cb(err)

          cb(null, buffer)
        })
      })
    })
  })
}
```

With `yield-callback`, you can instead write your `readFile()` function as a
generator, as below.  Note the generator takes a `cb` parameter at the end,
but it it works a bit different.  You pass it as the callback for async
functions, and it arranges to yield the callback parameters.

```js
function * readFileGen (fileName, cb) {
  var [err, fd] = yield fs.open(fileName, 'r', cb)
  if (err) return err

  var [err, stats] = yield fs.fstat(fd, cb)
  if (err) return err

  const buffer = new Buffer(stats.size)

  var [err, bytesRead] = yield fs.read(fd, buffer, 0, buffer.length, 0, cb)
  if (err) return err
  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  var [err] = yield fs.close(fd, cb)
  if (err) return err

  return buffer
}
```

You can then invoke the generator as below.  Note that you pass a callback
function in as the final parameter to `run()`, which will be invoked when
the generator finally returns.

```js
yieldCallback.run(readFileGen, fileName, function (err, buffer) {
  if (err) console.log(err)
  else console.log(buffer.toString('utf8'))
})
```

Or you can wrap the generator to return a "normal" callback function; in this
case, with the same signature and behavior as the pyramid-of-doom `readFile()`
above:

```js
const readFile = yieldCallback(readFileGen)

readFile(fileName, function (err, buffer) {
  if (err) console.log(err)
  else console.log(buffer.toString('utf8'))
})
```

Using `yield-callback` in this fashion requires destructuring support to
destructure the array returned from the `yield` statements into the individual
callback parameter values.  With Node.js v4, you can use the runtime option
`--harmony_destructuring` to run with destructuring support.

Of course, you don't need to use array destructuring, you can do it yourself:

```js
...
let $, err
...
$ = yield fs.open(fileName, 'r', cb)
err = $[0]
if (err) return err

const fd = $[1]
...
```

That's a bit icky, so there's another way to handle the callback parameters.
Still slightly icky, but ... *less* icky.

The "callback" parameter passed into the generator, `cb` in this case, also
has a property `props` which is a function which takes the callback parameter
names, and arranges to yield an object with those properties.  So you can do
the following:

```js
...
let $
...
$ = yield fs.open(fileName, 'r', cb.props('err fd'))
if ($.err) return $.err

const fd = $.fd
...
```

install
================================================================================

    npm install pmuellr/yield-callback
    npm install pmuellr/yield-callback#v0.3.0
    ...


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
returns.  The generator itself gets passed a "callback" function as it's
final parameter, which should be passed as the "callback" function on any
async calls that you make, as expressions in front of a `yield`:

```js
function * myGenerator(a, b, cb) {
  console.log('waiting(a)', a, 'ms')
  yield setTimeout(cb, a)

  console.log('waiting(b)', b, 'ms')
  yield setTimeout(cb, b)

  return [a + b]
}

const myWrapped = yieldCallback(myGenerator)

myWrapped(1000, 2000, function (val) {
  console.log('should be 3000:', val)
})
```

You can also run a generator directly, via the `run` function available on
the exported function (eg, `yieldCallback.run()`).

```js
yieldCallback.run(generatorFunction, arg1, arg2, ... callback)
```

This equivalent to:

```js
const wrapped = yieldCallback(generatorFunction)
wrapped(arg1, arg2, ... callback)
```


### API within the generator function

The generator function is passed as it's final parameter a special callback
function.  Typically you'd use this function by itself as an async callback
function, which is used as a `yield` expression:

```js
function * genFunction(a, b, cb) {
  ...
  yield setTimeout(cb, 1000)
  ...
}
```

The `yield` expression returns a value, which by default will be an array
of the parameters passed to the callback:

```js
function * genFunction(fileName, cb) {
  ...
  const result = yield fs.readFile(fileName, 'utf8', cb)
  // result[0] is `err`  from `fs.readFile()`
  // result[1] is `data` from `fs.readFile()`
  ...
}
```

These destructure well:

```js
function * genFunction(fileName, cb) {
  ...
  var [err, data] = yield fs.readFile(fileName, 'utf8', cb)
  ...
}
```

You can alternatively send an object as the result, by calling the `props`
function on the `cb` function, and specifying the properties you want set on
the object, as a space-separated string:

```js
function * genFunction(fileName, cb) {
  ...
  var {err, data} = yield fs.readFile(fileName, 'utf8', cb.props('err data'))
  ...
}
```

The value that the generator finally returns will be passed to the original
callback back passed into the wrapped (or run) function.  You should specify
the arguments passed to the callback as an array:

```js
yieldCallback.run(genFunction, aFileName, function outerCB (err, data) {})

function * genFunction(fileName, cb) {
  var [err, data] = yield fs.readFile(fileName, 'utf8', cb)
  return [err, data]  // calls outerCB(err, data)
}
```

As a short-cut, you can return an instance of `Error`, and that value will be
passed directly to the callback:

```js
function * genFunction(fileName, cb) {
  ...
  var {err, data} = yield fs.readFile(fileName, 'utf8', cb.props('err data'))
  if (err) return err  // calls outerCB(err)
  return [null, data]  // calls outerCB(null, data)
}
```

As a final short-cut, you can return an object which isn't an array or Error
instance, and that value will be passed as the second argument to the callback,
with null passed as the first argument:

```js
function * genFunction(fileName, cb) {
  ...
  var [err, data] = yield fs.readFile(fileName, 'utf8', cb)
  if (err) return err  // calls outerCB(err)
  return data          // calls outerCB(null, data)
}
```
