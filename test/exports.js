'use strict'

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

tapeRunner(function checkExports (t) {
  t.equal(typeof yieldCallback.run, 'function', 'run should be a function')
  t.equal(typeof yieldCallback.wrap, 'function', 'wrap should be a function')
  t.end()
})
