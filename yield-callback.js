'use strict'

module.exports = wrap

wrap.run = run
wrap.wrap = wrap

// wrap a generator function with yieldCallback
function wrap (generatorFn) {
  if (typeof generatorFn !== 'function') {
    throw Error('expecting initial argument to be a generator function')
  }

  return function wrapped () {
    const args = [].slice.call(arguments)
    args.unshift(generatorFn)

    run.apply(null, args)
  }
}

// call with (generatorFn, arg1, arg2, ..., cb)
function run (generatorFn) {
  if (typeof generatorFn !== 'function') {
    throw Error('expecting initial argument to be a generator function')
  }

  // get arguments
  const args = [].slice.call(arguments)

  // remove generatorFn
  args.shift()

  // get the final arg, which is the final callback
  const cbFinal = args.pop()
  if (typeof cbFinal !== 'function') {
    throw Error('expecting final argument to be a callback function')
  }

  // add the callback return property setter
  cbGen.err = null
  cbGen.errorResult = (err) => new ErrorResult(err)
  args.push(cbGen)

  // initial call to the generator
  const iter = generatorFn.apply(null, args)

  // proceed to first yield
  iter.next()

  // the callback function, used in the generator, which will set it's
  // arguments to the properties specified, and return from the yield
  function cbGen () {
    let result = [].slice.call(arguments)

    // pull the error off, assign to cb property
    cbGen.err = result.shift()

    // call onError handler, if there is one
    if (typeof cbGen.setError === 'function') {
      cbGen.setError(cbGen.err)
    }

    // flatten result, if 0 or 1 element
    if (result.length === 0) {
      result = null
    } else if (result.length === 1) {
      result = result[0]
    }

    // send result as the value of the yield, proceed to next yield
    let nextResult = iter.next(result)

    // did the generator return?  If so, call the final callback
    // - if they returned an error, call callback(err)
    // - otherwise, call callback(null, returnValue)
    if (nextResult.done) {
      let nextValue = nextResult.value

      if (nextValue instanceof ErrorResult) {
        cbFinal(nextValue.err)
      } else if (nextValue instanceof Error) {
        cbFinal(nextValue)
      } else {
        cbFinal(null, nextValue)
      }
    }
  }
}

class ErrorResult {
  constructor (err) { this.err = err }
}
