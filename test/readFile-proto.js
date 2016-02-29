/*eslint-disable no-redeclare */

'use strict'

const fs = require('fs')

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const FileContents = fs.readFileSync(__filename, 'utf8')

yieldCallback.installPrototype('$')

tapeRunner(function testReadFile (t) {
  readFileGen.$(__filename, (err, buffer) => {
    t.notok(err, 'err should be null')
    t.equal(buffer.toString('utf8'), FileContents, 'buffer should be file contents')
    t.end()
  })
})

tapeRunner(function testNonExistantFile (t) {
  readFileGen.$(`${__filename}.nope`, (err, buffer) => {
    t.ok(err instanceof Error, 'err should be an Error')
    t.notok(buffer, 'buffer should be null')
    t.end()
  })
})

function * readFileGen (fileName, cb) {
  var [err, fd] = yield fs.open(fileName, 'r', cb)
  if (err) return err

  var [err, stats] = yield fs.fstat(fd, cb)
  if (err) return err

  const buffer = new Buffer(stats.size)

  var [err, bytesRead] = yield fs.read(fd, buffer, 0, buffer.length, 0, cb)
  if (err) return err
  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  var [err] = yield fs.close(fd, cb)
  if (err) return err

  return buffer
}
