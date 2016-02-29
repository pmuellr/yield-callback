yield-callback - run async/callback functions in a sync style, with generators
================================================================================

Run asynchronous/callback functions in a synchronous style, inside a generator.

Examples
================================================================================

Simple example that doesn't deal with parameters or return values.

    const yieldCallback = require('yield-callback')

    yieldCallback.run(waitTwiceGen, function cb () {
      console.log('waitTwice() finished')
    })

    function * waitTwiceGen (cb) {
      console.log('waiting one second')
      yield setTimeout(cb(), 1000)

      console.log('waiting another second')
      yield setTimeout(cb(), 1000)
    }

Same example as above, but using `wrap()`.

    const waitTwice = yieldCallback.wrap(waitTwiceGen)

    waitTwice(function cb () {
      console.log('waitTwice() finished')
    })

    function * waitTwiceGen (cb) {
      console.log('waiting one second')
      yield setTimeout(cb(), 1000)

      console.log('waiting another second')
      yield setTimeout(cb(), 1000)
    }

Example that reads a file with the `fs` module. In this case we see
examples of using the callback passed to the generator, to name the
actual callback parameters for a function, and then access those parameters
via the result yielded by the invocation - in the `$` variable.  In addition,
the generator function either returns an Error if an error occurred, or else
returns a Buffer if no error occurred.  The wrapped version of the generator
is node-styled, in that it takes an error as the first parameter, and a
result object as the second; yield-callback will pass the returned value
to the appropriate parameter.

    const readFile = yieldCallback.wrap(readFileGen)

    readFile(__filename, function (err, buffer) {
      if (err) return console.log(err)
      console.log(buffer.toString('utf8'))
    })

    function * readFileGen (fileName, cb) {
      let $

      $ = yield fs.open(fileName, 'r', cb('err fd'))
      if ($.err) return $.err

      const fd = $.fd

      $ = yield fs.fstat(fd, cb('err stats'))
      if ($.err) return $.err

      const buffer = new Buffer($.stats.size)

      $ = yield fs.read(fd, buffer, 0, buffer.length, 0, cb('err bytesRead buffer'))
      if ($.err) return $.err
      if ($.bytesRead !== buffer.length) return new Error('EMOREFILE')

      $ = yield fs.close(fd, cb('err'))
      if ($.err) return $.err

      return buffer
    }

You can also have the callback parameters returned as an array, instead of an
object, in which case you call the callback passed by the generator with no
arguments (requires `--harmony_destructuring` for Node 4.x):

    function * readFileGen (fileName, cb) {
      var [err, fd] = yield fs.open(fileName, 'r', cb())
      if (err) return err

      var [err, stats] = yield fs.fstat(fd, cb())
      if (err) return err

      const buffer = new Buffer(stats.size)

      var [err, bytesRead] = yield fs.read(fd, buffer, 0, buffer.length, 0, cb())
      if (err) return err
      if (bytesRead !== buffer.length) return new Error('EMOREFILE')

      var [err] = yield fs.close(fd, cb())
      if (err) return err

      return buffer
    }

You can see this form lends itself to destructuring the result into local
variables.  The future will be nice!


API
================================================================================

This module exports two functions:

* **`run(generatorFunction, arg1, arg2, ... callback)`**

  Runs `generatorFunction`, passing the specified arguments, calling
  `callback` when the generatorFunction returns.

* **`wrap(generatorFunction)`**

  Returns a new function, which will call the generator function with the
  specified arguments.  The final callback should be passed as the final
  parameter.

In both cases, the `generatorFunction` is run as follows:

* Async callback functions can be invoked behind a yield, where you pass an
  invocation of the callback passed to the generator, as the callback parameter
  of the async function.

* The callback passed to the generator is a function that you call with the
  names of the expected callback parameters, in a space-separated string, in the
  order they are defined in the callback function. Or you can pass no arguments
  and an array of the parameters will be returned.

  Eg, for `fs.open()`, the callback passes `err` and `fd`, so you would invoke
  it as:

        const result = yield fs.open(fileName, cb('err fd'))
        var [err, fd] = yield fs.open(fileName, cb())


* The result of the yield expression will be an object, with properties named as
  above, or an array of the actual callback parameters.  Eg, for the first
  `yield`, you can reference the `err` parameter of the callback via
  `result.err` and the `fd` parameter as `result.fd`. For the second `yield`, an
  array is returned with the values of `err` and `fd`.

* When the generator returns, it will call the top-level callback with the
  result from the generator, with the following rules:

  * if the generator returned an array, that array will be applied to the
    callback; eg, `cb.apply(null, result)`.  Use this if you want to pass
    an array or error as the non-error result, or you just want to be
    explicit about the return value.

  * if the generator returned an error, the error will be passed as the
    first parameter; eg, `cb(err)`.  An error responds true to
    `instanceof Error`.

  * otherwise, the object will be passed as the second parameter; eg,
    `cb(null, data)`

  The rule is, if you are using a `(err, data)` node-style callback, and the
  `data` isn't an array, you can return an Error object or non-array data object
  by themselves, and yield-callback will figure out what to do.  If the `data`
  is or might be an array, you should use the explicit form of returning
  an array of the callback parameters.
