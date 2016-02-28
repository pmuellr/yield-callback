'use strict'

const path = require('path')

const tape = require('tape')

module.exports = tapeRunner

function tapeRunner (fileName) {
  fileName = path.basename(fileName)

  return function tapeRunner_ (fn) {
    const fnName = fn.name || 'anonymous!'
    return tape(`${fileName}: ${fnName}()`, fn)
  }
}
