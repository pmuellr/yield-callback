'use strict'

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

function noop () {}
function * noopGen () { yield false }

tapeRunner(function noGeneratorRun (t) {
  try {
    yieldCallback.run('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noGeneratorWrap (t) {
  try {
    yieldCallback('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noCbRun (t) {
  try {
    yieldCallback.run(noopGen, 'foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noCbWrap (t) {
  const wrappedTR = yieldCallback(noopGen)

  try {
    wrappedTR('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass(`should have thrown an error: ${err}`)
  }
  t.end()
})

tapeRunner(function noGenRun (t) {
  let err
  yieldCallback.run(noop, (err_) => { err = err_ })

  t.ok(err, `should have thrown an error: ${err}`)
  t.end()
})

tapeRunner(function nullDerefBeforeYield (t) {
  let err

  try {
    yieldCallback.run(nullBeforeYield, noop)
  } catch (err_) {
    err = err_
  }

  function * nullBeforeYield (cb) {
    let obj

    obj.doSomething()
  }

  t.ok(err, `expecting error: ${err}`)
  t.end()
})

tapeRunner(function nullDerefAfterYield (t) {
  let err

  function uce (err_) { err = err_ }

  process.addListener('uncaughtException', uce)

  yieldCallback.run(nullAfterYield, noop)

  function * nullAfterYield (cb) {
    let obj

    yield setTimeout(cb, 10)
    obj.doSomething()
  }

  setTimeout(onTimeout, 100)

  function onTimeout () {
    process.removeListener('uncaughtException', uce)
    t.ok(err, `expecting error: ${err}`)
    t.end()
  }
})
