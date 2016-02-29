'use strict'

const fs = require('fs')

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const FileContents = fs.readFileSync(__filename, 'utf8')

const readFile = yieldCallback(readFileGen)

tapeRunner(function testReadFile (t) {
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

function * readFileGen (fileName, cb) {
  var [err, fd] = yield fs.open(fileName, 'r', cb) // eslint-disable-line no-redeclare
  if (err) return err

  var [err, stats] = yield fs.fstat(fd, cb) // eslint-disable-line no-redeclare
  if (err) return err

  const buffer = new Buffer(stats.size)

  var [err, bytesRead] = yield fs.read(fd, buffer, 0, buffer.length, 0, cb) // eslint-disable-line no-redeclare
  if (err) return err
  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  var [err] = yield fs.close(fd, cb) // eslint-disable-line no-redeclare
  if (err) return err

  return buffer
}
