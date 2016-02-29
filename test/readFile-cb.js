'use strict'

const fs = require('fs')

const tapeRunner = require('./tapeRunner')(__filename)

const FileContents = fs.readFileSync(__filename, 'utf8')

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

function readFile (fileName, cb) {
  fs.open(fileName, 'r', function (err, fd) {
    if (err) return cb(err)

    fs.fstat(fd, function (err, stats) {
      if (err) return cb(err)

      const buffer = new Buffer(stats.size)

      fs.read(fd, buffer, 0, buffer.length, 0, function (err, bytesRead) {
        if (err) return cb(err)
        if (bytesRead !== buffer.length) return cb(new Error('EMOREFILE'))

        fs.close(fd, function (err) {
          if (err) return cb(err)

          cb(null, buffer)
        })
      })
    })
  })
}
