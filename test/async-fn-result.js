'use strict'

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const interestingResult1 = yieldCallback(interestingResultGen1)
const interestingResult2 = yieldCallback(interestingResultGen2)

tapeRunner(function testInterestingResult_1 (t) {
  interestingResult1(1, function cb (err, oldValue, newValue, lstValue) {
    t.equal(err, null, 'err should be null')
    t.equal(oldValue, 1, 'oldValue should be 1')
    t.equal(newValue, 2, 'newValue should be 2')
    t.equal(lstValue, 3, 'lstValue should be 3')
    t.end()
  })
})

tapeRunner(function testInterestingResult_2 (t) {
  interestingResult2(42, function cb (err, oldValue, newValue, lstValue) {
    t.equal(err, null, 'err should be null')
    t.equal(oldValue, 42, 'oldValue should be 42')
    t.equal(newValue, 43, 'newValue should be 43')
    t.equal(lstValue, 44, 'lstValue should be 44')
    t.end()
  })
})

// function returns value passed in, cb returns value + 1
function asyncWithResult (value, cb) {
  process.nextTick(function () { cb(null, value + 1) })
  return value
}

function * interestingResultGen1 (value, cb) {
  let $1, $2

  $1 = yield asyncWithResult(value, cb.props('err value'))
  $2 = yield asyncWithResult($1.value, cb.props('err value'))

  return [$2.err, $1._, $2._, $2.value]
}

function * interestingResultGen2 (value, cb) {
  let $1, $2

  $1 = yield asyncWithResult(value, cb)
  $2 = yield asyncWithResult($1[1], cb)

  return [$2[0], $1._, $2._, $2[1]]
}
