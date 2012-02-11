var EventEmitter = process.EventEmitter
  , EventReactor = require('../lib')

// also enable emit overloading, which could give a bit of a performance hit,
// but also adds great new functionality
EventReactor(true)

describe('EventReactor', function () {
  it('exports the current version number', function () {
    EventReactor.version.should.match(/[0-9]+\.[0-9]+\.[0-9]+/)
    EventReactor.version.should.be.a('string')
  })

  it('is a function', function () {
    EventReactor.should.be.a('function')
  })

  it('introduces new function aliases', function () {
    var proto = EventEmitter.prototype

    proto.off.should.equal(proto.removeListener)
    proto.removeEventListener.should.equal(proto.removeListener)
    proto.addEventListener.should.equal(proto.addListener)
  })

  describe('#has', function () {
    it('is added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.has.should.be.a('function')
    })

    it('only has the example function', function () {
      var EE = new EventEmitter
        , example = function () {}

      EE.on('example', example)

      EE.has('example', example).should.be.true
      EE.has('testcase', example).should.be.false
      EE.has('example', function () {}).should.be.false
    })
  })

  describe('#every', function () {
    it('is added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.every.should.be.a('function')
    })

    it('is chainable', function () {
      var EE = new EventEmitter

      EE.every().should.equal(EE)
    })

    it('subscribes to every given event', function (next) {
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

  describe('#either', function () {
    it('is added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.either.should.be.a('function')
    })

    it('is chainable', function () {
      var EE = new EventEmitter

      EE.either().should.equal(EE)
    })

    it('emit the event once, and it listens to every applied event', function () {
      var EE = new EventEmitter
        , count = 0

      function listen () {
        ++count;
      }

      EE.either('foo', 'bar', 'baz', listen)
      EE.emit('foo')

      count.should.equal(1)
      EE.emit('bar')
      count.should.equal(1)

      EE.either('foo', 'bar', 'baz', listen)
      EE.emit('bar')

      count.should.equal(2)
    })
  })

  describe('#multiple', function () {
    it('is added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.multiple.should.be.a('function')
    })

    it('is chainable', function () {
      var EE = new EventEmitter

      EE.multiple().should.equal(EE)
    })

    it('adds multiple event listeners', function (next) {
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
    it('is added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.idle.should.be.a('function')
    })

    it('is chainable', function () {
      var EE = new EventEmitter

      EE.idle().should.equal(EE)
    })

    it('fires the idle callback', function (next) {
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

    it('resets the idle timer when the event is emitted', function (next) {
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

  describe('#delay', function () {
    it('is added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.delay.should.be.a('function')
    })

    it('is chainable', function () {
      var EE = new EventEmitter

      EE.delay().should.equal(EE)
    })

    it('delays the emitted event', function (next) {
      var EE = new EventEmitter
        , count = 0

      EE.on('pewpew', function pewpew (arg1, arg2) {
        arg1.should.equal('pew pew')
        arg2.should.equal('pong pong')

        arguments.length.should.equal(2)
        ++count
      })

      EE.on('foobar', function foobar (arg1, arg2) {
        arg1.should.equal('lalala')
        arg2.should.equal('trololol')

        arguments.length.should.equal(2)
        ++count
      })

      EE.delay('pewpew', 10, 'pew pew', 'pong pong')
      EE.delay('foobar', 20, 'lalala', 'trololol')

      setTimeout(function () {
        count.should.equal(1)
      }, 15)

      setTimeout(function () {
        count.should.equal(2)
        next()
      }, 30)
    })
  })

  describe('#defer', function () {
    it('is added to the EventEmitter.prototype', function () {
      EventEmitter.prototype.defer.should.be.a('function')
    })

    it('is chainable', function () {
      var EE = new EventEmitter

      EE.defer().should.equal(EE)
    })

    it('runs before a setTimeout(0)', function (next) {
      var EE = new EventEmitter
        , called = false

      EE.on('defered', function (arg1, arg2) {
        arg1.should.equal('foo')
        arg2.should.equal('bar')

        called.should.be.false
        called = true
      })

      EE.on('readyornot', function () {
        called.should.be.true
        next()
      })

      !function callstackpadding () {
        called.should.be.false
      }()

      setTimeout(function timeout () {
        EE.emit('readyornot')
      }, 0)

      EE.defer('defered', 'foo', 'bar')
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
