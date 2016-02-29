'use strict'

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

tapeRunner(function noGeneratorRun (t) {
  try {
    yieldCallback.run('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass('should have thrown an error')
  }
  t.end()
})

tapeRunner(function noGeneratorWrap (t) {
  try {
    yieldCallback('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass('should have thrown an error')
  }
  t.end()
})

tapeRunner(function noCbRun (t) {
  try {
    yieldCallback.run(tapeRunner, 'foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass('should have thrown an error')
  }
  t.end()
})

tapeRunner(function noCbWrap (t) {
  const wrappedTR = yieldCallback(tapeRunner)

  try {
    wrappedTR('foo')
    t.fail('should have thrown an error')
  } catch (err) {
    t.pass('should have thrown an error')
  }
  t.end()
})
