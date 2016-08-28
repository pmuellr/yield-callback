'use strict'

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

function noop () {}

function testBody (t, testGen) {
  let err

  function uce (err_) { err = err_ }

  process.addListener('uncaughtException', uce)

  setTimeout(onTimeout, 100)

  yieldCallback.run(testGen, noop)

  function onTimeout () {
    process.removeListener('uncaughtException', uce)
    t.ok(err, `expecting error: ${err}`)
    t.end()
  }
}

tapeRunner(function testCb (t) { testBody(t, testGenCb) })
tapeRunner(function testCbCb (t) { testBody(t, testGenCbCb) })
tapeRunner(function testCbYieldCb (t) { testBody(t, testGenCbYieldCb) })
tapeRunner(function testCbCbYield (t) { testBody(t, testGenCbCbYield) })
tapeRunner(function testYieldCbCb (t) { testBody(t, testGenYieldCbCb) })

// -----------------------------------------------------------------------------

function * testGenCb (cb) { cb() }
function * testGenCbCb (cb) { cb(); cb() }
function * testGenCbYieldCb (cb) { cb(); yield setTimeout(cb, 100); cb() }
function * testGenCbCbYield (cb) { cb(); cb(); yield setTimeout(cb, 300) }
function * testGenYieldCbCb (cb) { yield setTimeout(cb, 100); cb(); cb() }
