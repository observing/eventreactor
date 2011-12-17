var EventEmitter = process.EventEmitter
  , EventReactor = require('../lib')

// also enable emit overloading, which could give a bit of a performance hit,
// but also adds great new functionality
EventReactor(true)

describe('EventReactor', function () {
  it('should exports the current version number', function () {
    EventReactor.version.should.match(/[0-9]+\.[0-9]+\.[0-9]+/)
    EventReactor.version.should.be.a('string')
  })

  it('should be a function', function () {
    EventReactor.should.be.a('function')
  })

  describe('#has', function () {
    it('should be added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.has.should.be.a('function')
    })

    it('should only have the example function', function () {
      var EE = new EventEmitter
        , example = function () {}

      EE.on('example', example)

      EE.has('example', example).should.be.true
      EE.has('testcase', example).should.be.false
      EE.has('example', function () {}).should.be.false
    })
  })

  describe('#every', function () {
    it('should be added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.every.should.be.a('function')
    })

    it('should subscribe to every given event', function (next) {
      var EE = new EventEmitter
        , count = 0

      EE.every('events', 'here', 'could', 'be', 'fired', function () {
        ++count
      })

      EE.emit('events')
      EE.emit('here')
      EE.emit('could')
      EE.emit('be')
      EE.emit('fired')

      EE.emit('except')
      EE.emit('these')

      // for some odd reason it seems like that the events are fired
      // async, without a setTimeout it wines about 4 count's instead of 5
      setTimeout(function () {
        count.should.equal(5)
        next()
      }, 10)
    })
  })

  describe('#multiple', function () {
    it('should be added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.multiple.should.be.a('function')
    })

    it('multiple event listeners', function (next) {
      var EE = new EventEmitter
        , count = 0

      // simple event listen function
      function listen (expected, type) {
        expected.should.equal(type)
        ++count
      }

      EE.multiple({
          error: listen.bind(null, 'error')
        , timeout: listen.bind(null, 'timeout')
        , disconnect: listen.bind(null, 'disconnect')
        , reconnect: listen.bind(null, 'reconnect')
        , abort: listen.bind(null, 'abort')
      })

      // test to see if all events applied
      EE.emit('error', 'error')
      EE.emit('timeout', 'timeout')
      EE.emit('disconnect', 'disconnect')
      EE.emit('reconnect', 'reconnect')
      EE.emit('abort', 'abort')

      // see above for the odd timeout thingy
      setTimeout(function () {
        count.should.equal(5)
        next()
      }, 10)
    })
  })

  describe('#idle', function () {
    it('should be added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.idle.should.be.a('function')
    })

    it('idle fires callback', function (next) {
      var EE = new EventEmitter
        , count = 0

      function callback (event, argument1, argument2) {
        event.should.equal('timeout')
        argument1.should.equal('argument1')
        argument2.should.equal('argument2')
        next()
      }

      EE.idle('timeout', 10, callback, 'argument1', 'argument2')
    })

    it('idle resets when event is emitted', function (next) {
      var EE = new EventEmitter
        , callbackcount = 0
        , eventcount = 0

      function callback (event) {
        event.should.equal('timeout')

        eventcount.should.equal(2)
        callbackcount++
      }

      EE.idle('timeout', 10, callback)

      EE.on('timeout', function () { eventcount++ })

      setTimeout(function () {
        EE.emit('timeout')
      }, 2)

      setTimeout(function () {
        EE.emit('timeout')
      }, 4)

      // idle should only be called once, the extra 10ms are for padding
      setTimeout(function () {
        callbackcount.should.equal(1)
        next()
      }, 20)
    })
  })

  describe('uncaught events', function () {
    it('capture non listening events', function (next) {
      var EE = new EventEmitter
        , count = 0
        , unexisting = [
              'i dont exist'
            , 'me neither'
            , 'nor do i'
          ]
        , i = unexisting.length

      EE.on('uncaught', function (event, data) {
        unexisting.indexOf(event).should.be.above(-1)
        count++
      })

      // add an existing listener
      EE.on('exists', function () {})

      // loop over the unexisting events
      while (i--) EE.emit(unexisting[i])

      // make sure that existing stuff still works
      EE.emit('exists')

      setTimeout(function () {
        count.should.equal(3)
        next()
      }, 10)
    })
  })
})
