var EventEmitter = process.EventEmitter;

// initialize our module
require('../lib')(true);

module.exports = {
    'has event': function () {
      var EE = new EventEmitter
        , example = function () {};

      EE.on('example', example);

      // test this shizz
      EE.has('example', example).should.be_true;
      EE.has('testcase', example).should.be_false;
      EE.has('example', function () {}).should.be_false;
    }

  , 'subscribe to every given event': function () {
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
      }, 10);
    }

  , 'capture non listening events': function () {
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
      }, 10);
    }

  , 'multiple event listeners': function () {
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
      }, 10);
    }
};
