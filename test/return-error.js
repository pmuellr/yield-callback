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
  let $

  $ = yield fs.open(fileName, 'r', cb.props('err fd'))
  if ($.err) return $.err

  return $.fd
}
