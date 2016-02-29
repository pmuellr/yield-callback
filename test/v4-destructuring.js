/*eslint-disable no-eval */

'use strict'

const tapeRunner = require('./tapeRunner')(__filename)

tapeRunner(function v4orBetter (t) {
  let match = process.version.match(/v(.*?)\.(.*?)\.(.*?)/)

  t.ok(match[1] >= '4', 'node version should be 4 or greater')
  t.end()
})

// for node 4, invoke node with --harmony_destructuring
tapeRunner(function shouldSupportDestructuring (t) {
  let code = 'var [a, b] = [1, 2]'

  try {
    eval(code)
  } catch (err) {
    t.fail('should support destructuring')
  }

  t.end()
})
