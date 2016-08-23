'use strict'

const fs = require('fs')

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const readFile = yieldCallback(readFileGen)

tapeRunner(function testReturnError (t) {
  readFile('nope.nope', (err, buffer) => {
    t.ok(err instanceof Error, 'err should be instance of Error')
    t.notok(buffer, 'buffer should be null')
    t.end()
  })
})

function * readFileGen (fileName, cb) {
  const fd = yield fs.open(fileName, 'r', cb)
  if (cb.err) return cb.err

  return fd
}
