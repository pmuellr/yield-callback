'use strict'

module.exports = wrap

wrap.run = run
wrap.wrap = wrap
wrap.installPrototype = installPrototype

// installs a new function on Function.prototype, which wraps a generator
// This is pretty evil, and most likely not really supported, since eslint
// complains that Function.prototype is not updateable like this ...
function installPrototype (name) {
  Function.prototype[name] = function () { // eslint-disable-line no-extend-native
    return wrap(this).apply(null, arguments)
  }
}

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

  let nextResult = null
  let nextValue = null
  let isArray = true
  let propNames = []

  cbParmsToResultAssigner.props = cbAssignPropsToResult

  // add the callback return property setter
  args.push(cbParmsToResultAssigner)

  // initial call to the generator
  const iter = generatorFn.apply(null, args)

  // proceed to first yield
  nextResult = iter.next()
  nextValue = nextResult.value

  // the callback function, used in the generator, which will set it's
  // arguments to the properties specified, and return from the yield
  function cbParmsToResultAssigner () {
    let result

    // assign the callback arguments ...
    if (isArray) {
      // to an array
      result = [].slice.call(arguments)
    } else {
      // to the properties of an object
      result = {}
      for (let i = 0; i < propNames.length; i++) {
        result[propNames[i]] = arguments[i]
      }
    }

    // send result as the value of the yield, proceed to next yield
    result._ = nextValue
    nextResult = iter.next(result)
    nextValue = nextResult.value

    // did the generator return?  If so, call the final callback
    // - if they returned returned an array, apply that to the callback
    // - if they returned an error, call callback(err)
    // - otherwise, call callback(null, returnValue)
    if (nextResult.done) {
      if (Array.isArray(nextValue)) {
        cbFinal.apply(null, nextValue)
      } else if (nextValue instanceof Error) {
        cbFinal(nextValue)
      } else {
        cbFinal(null, nextValue)
      }
    }
  }

  // callback function inside the generator, describing return properties as
  // a string of property names, or an empty array
  function cbAssignPropsToResult (vars) {
    isArray = false

    // no args same as array
    if (vars == null) vars = []

    if (Array.isArray(vars)) {
      // passed array, so wants array as result
      isArray = true
    } else {
      // parse vars as space-separated property names
      propNames = `${vars}`.trim().split(/\s+/)
    }

    // return the function that sets the result properties from args
    return cbParmsToResultAssigner
  }
}
