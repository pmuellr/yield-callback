'use strict'

const fs = require('fs')

const yieldCallback = require('..')
const tapeRunner = require('./tapeRunner')(__filename)

const FileContents = fs.readFileSync(__filename, 'utf8')

const readFile = function (fileName, cb) {
  yieldCallback.run(readFileGen, fileName, cb)
}

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
  const fd = yield fs.open(fileName, 'r', cb)
  if (cb.err) return cb.err

  const stats = yield fs.fstat(fd, cb)
  if (cb.err) return cb.err

  const buffer = new Buffer(stats.size)

  const bytesReadBuffer = yield fs.read(fd, buffer, 0, buffer.length, 0, cb)
  if (cb.err) return cb.err

  const bytesRead = bytesReadBuffer[0]
  const bufferRead = bytesReadBuffer[1]
  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  yield fs.close(fd, cb)
  if (cb.err) return cb.err

  return bufferRead
}
