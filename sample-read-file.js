'use strict'

const fs = require('fs')

const yieldCallback = require('./yield-callback')

// get fileName argument
const fileName = process.argv[2]

// make sure a fileName was passed
if (fileName == null) {
  console.log('invoke this program with a file name')
  process.exit(1)
}

// read the file, print err or contents upon reading it
readFile(fileName, (err, buffer) => {
  if (err) return console.log(`error reading file '${fileName}': ${err}`)

  console.log(buffer.toString())
})

// wrapper for the generator version of readFile()
function readFile (fileName, cb) {
  yieldCallback.run(readFileGen, fileName, cb)
}

// generator version of readFile()
function * readFileGen (fileName, cb) {
  // fs.open()'s cb: (err, fd)
  const fd = yield fs.open(fileName, 'r', cb)
  if (cb.err) return cb.err

  // fs.fstat()'s cb: (err, stats)
  const stats = yield fs.fstat(fd, cb)
  if (cb.err) return cb.err

  const buffer = new Buffer(stats.size)

  // fs.read()'s cb: (err, bytesRead, buffer)
  const bytesReadBuffer = yield fs.read(fd, buffer, 0, buffer.length, 0, cb)
  if (cb.err) return cb.err

  // fs.read()'s cb invoked as cb(err, bytesRead, buffer), so we get an array
  const bytesRead = bytesReadBuffer[0]
  const bufferRead = bytesReadBuffer[1]
  if (bytesRead !== buffer.length) return new Error('EMOREFILE')

  // fs.close()'s cb: (err)
  yield fs.close(fd, cb)
  if (cb.err) return cb.err

  // invokes readFile()'s cb as cb(null, bufferRead)
  return bufferRead
}
