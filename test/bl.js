'use strict'

const fs = require('fs')

const bl = require('bl')

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const FileContents = fs.readFileSync(__filename, 'utf8')

const readFile = yieldCallback(readFileWithBlGen)

tapeRunner(function test_bl (t) {
  readFile(__filename, (err, buffer) => {
    t.notok(err, 'err should be null')
    t.equal(buffer.toString('utf8'), FileContents, 'buffer should be file contents')
    t.end()
  })
})

tapeRunner(function testNonExistantFile (t) {
  readFile(`${__filename}.nope`, (err, buffer) => {
    t.ok(err instanceof Error, 'err should be an Error')
    t.notok(buffer, 'buffer should be null')
    t.end()
  })
})

function * readFileWithBlGen (fileName, cb) {
  let $

  let rStream

  try {
    rStream = fs.createReadStream(fileName)
  } catch (err) {
    return err
  }

  $ = yield rStream.pipe(bl(cb.props('err buffer')))
  if ($.err) return $.err

  return $.buffer
}
