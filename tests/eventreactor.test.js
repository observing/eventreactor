var EventEmitter = process.EventEmitter
  , er = require('../lib');

// also enable bind overloading
er(true);

module.exports = {
    'exports version number': function () {
      er.version.should.match(/[0-9]+\.[0-9]+\.[0-9]+/);
    }

  , 'has event': function () {
      var EE = new EventEmitter
        , example = function () {};

      EE.on('example', example);

      // test this shizz
      EE.has('example', example).should.be_true;
      EE.has('testcase', example).should.be_false;
      EE.has('example', function () {}).should.be_false;
    }

  , 'subscribe to every given event': function (next) {
      var EE = new EventEmitter
        , count = 0;

      EE.every('events', 'here', 'could', 'be', 'fired', function () {
        ++count;
      });

      EE.emit('events');
      EE.emit('here');
      EE.emit('could');
      EE.emit('be');
      EE.emit('fired');
      EE.emit('non existant');

      // for some odd reason it seems like that the events are fired
      // async, without a setTimeout it wines about 4 count's instead of 5
      setTimeout(function () {
        count.should.equal(5);
        next();
      }, 10);
    }

  , 'capture non listening events': function (next) {
      var EE = new EventEmitter
        , count = 0
        , unexisting = [
            'i dont exist'
          , 'me neither'
          , 'nor do i'
          ]
        , i = unexisting.length;

      EE.on('uncaught', function (event, data) {
        unexisting.indexOf(event).should.be.above(-1);
        count++;
      });

      EE.on('exists', function () {});

      while (i--) EE.emit(unexisting[i]);
      EE.emit('exists');

      // see above for the odd timeout thingy
      setTimeout(function () {
        count.should.equal(3);
        next();
      }, 10);
    }

  , 'multiple event listeners': function (next) {
      var EE = new EventEmitter
        , count = 0;

      function listen () {
        count++;
      }

      EE.multiple({
          error: listen
        , timeout: listen
        , disconnect: listen
        , reconnect: listen
        , abort: listen
      });

      // test to see if all events applied
      EE.emit('error');
      EE.emit('timeout');
      EE.emit('disconnect');
      EE.emit('reconnect');
      EE.emit('abort');

      // see above for the odd timeout thingy
      setTimeout(function () {
        count.should.equal(5);
        next();
      }, 10);
    }

  , 'idle fires callback': function (next) {
      var EE = new EventEmitter
        , count = 0;

      function callback (event, argument1, argument2) {
        event.should.equal('timeout');
        argument1.should.equal('argument1');
        argument2.should.equal('argument2');
        count++;
      }

      EE.idle('timeout', 10, callback, 'argument1', 'argument2');

      // idle should only be called once, the extra 10ms are for padding
      setTimeout(function () {
        count.should.equal(1);
        next();
      }, 30);
    }

  , 'idle resets when event is emitted': function (next) {
      var EE = new EventEmitter
        , callbackcount = 0
        , eventcount = 0;

      function callback (event) {
        event.should.equal('timeout');

        eventcount.should.equal(2);
        callbackcount++;
      }

      EE.idle('timeout', 10, callback);

      EE.on('timeout', function () { eventcount++; });

      setTimeout(function () {
        EE.emit('timeout');
      }, 2);

      setTimeout(function () {
        EE.emit('timeout');
      }, 4);

      // idle should only be called once, the extra 10ms are for padding
      setTimeout(function () {
        callbackcount.should.equal(1);
        next();
      }, 20);
    }
};
