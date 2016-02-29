'use strict'

const fs = require('fs')

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const readFile = yieldCallback.wrap(readFileGen)

tapeRunner(function test_bl (t) {
  readFile('nope.nope', (err, buffer) => {
    t.ok(err instanceof Error, 'buffer should be instance of Error')
    t.notok(buffer, 'buffer should be null')
    t.end()
  })
})

function * readFileGen (fileName, cb) {
  let $

  $ = yield fs.open(fileName, 'r', cb('err fd'))
  if ($.err) return $.err

  return $.fd
}
