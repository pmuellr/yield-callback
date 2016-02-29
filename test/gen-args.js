'use strict'

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const sumArgs = yieldCallback(sumArgsGen)

tapeRunner(function testSumArgs_6 (t) {
  sumArgs(1, 2, 3, (err, sum) => {
    t.notok(err, 'err should be null')
    t.equal(sum, 6, 'sum should be 6')
    t.end()
  })
})

tapeRunner(function testSumArgs_132 (t) {
  sumArgs(42, 44, 46, (err, sum) => {
    t.notok(err, 'err should be null')
    t.equal(sum, 132, 'sum should be 132')
    t.end()
  })
})

function * sumArgsGen (a, b, c, cb) {
  // the business logic of this function is synchronous, so we need to make
  // the generator async ...
  yield process.nextTick(cb)

  return a + b + c
}
