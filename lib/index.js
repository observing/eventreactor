(function () {
  var inNode = false
    , inBrowser = false;

  if (typeof window === 'undefined') {
    inNode = true;
  } else {
    inBrowser = true;
  }

  /**
   * Library dependencies.
   */

  var EventEmitter = (inNode ? process.EventEmitter : window.EventEmitter)
    , slice = Array.prototype.slice
    , concat = Array.prototype.concat;

  /**
   * Apply the same callback to every given event.
   *
   * @api public
   */

  EventEmitter.prototype.every = function every () {
    var args = slice.call(arguments, 0)
      , fn = args.pop()
      , i = args.length;

    while (i--) {
      this.on(args[i], fn);
    }

    return this;
  };

  /**
   * This function should be called once by either one of these given events.
   *
   * @api public
   */

  EventEmitter.prototype.either = function either () {
    var args = slice.call(arguments, 0)
      , fn = args.pop()
      , i = args.length;

    function callback () {
      fn.apply(this, arguments);

      // remove all the assigned event listeners again
      i = args.length;
      while (i--) {
        this.removeListener(args[i], callback);
      }
    }

    // assign the event listeners
    i = args.length;
    while (i--) {
      this.on(args[i], callback);
    }

    return this;
  };

  /**
   * Small utility to use a object to assign EventEmitters.
   *
   * @param {Object} events
   * @api public
   */

  EventEmitter.prototype.multiple = function multiple (events) {
    for (var event in events) {
      if (events.hasOwnProperty(event)) {
        this.on(event, events[event]);
      }
    }

    return this;
  };

  /**
   * Checks if the event is already added to the event emitter. Useful to prevent
   * memory leaks.
   *
   * @param {String} event name of the event
   * @param {Function} fn callback
   * @returns {Boolean} do we have the event or not
   * @api public
   */

  EventEmitter.prototype.has = function has (event, fn) {
    if (event && this._events && this._events[event]) {
      // optimize the case of one listener
      if (typeof this._events[event] == 'function')
        return fn === this._events[event];

      return this._events[event].indexOf(fn) >= 0;
    }

    return false;
  };

  /**
   * Sets an idle timer for an event. If the event has not been emitted
   * within the time frame specified, the callback is executed with the
   * supplied arguments.
   *
   * @param {String} event name of the event
   * @param {Number} timeout number of ms of idle time allowed
   * @param {Function} fn callback
   * @param {Object} arg1 first of any arguments to include
   * @api public
   */

  EventEmitter.prototype.idle = function idle (event, timeout, fn) {
    var args = slice.call(arguments, 0).slice(3)
      , self = this;

    /**
     * Callback wrapper.
     *
     * @api private
     */

    function callback () {
      self.removeListener(event, self.idle);

      var nargs = args.slice(0);
      nargs.unshift(event);

      fn.apply(self, nargs);
    }

    var timerId = setTimeout(callback, timeout);

    // remove the timeout and reset the idle timer in case of event
    this.once(event, function removeTimout () {
      clearTimeout(timerId);

      args.unshift(fn);
      args.unshift(timeout);
      args.unshift(event);

      self.idle.apply(self, args);
    });

    return this;
  };

  /**
   * Delay the execution of the emitting of the event.
   *
   * @param {String} event
   * @param {Number} timeout
   * @api public
   */

  EventEmitter.prototype.delay = function delay (event, timeout) {
    var self = this
      , args = slice.call(arguments, 0);

    // remove the time argument from the arguments array
    args.splice(1, 1);

    setTimeout(function timeout () {
      self.emit.apply(self, args);
    }, timeout);

    return this;
  };

  /**
   * Defer execution until the call stack is empty and the event has been
   * progressed to the next tick.
   *
   * It follows the same argument structure as regular emit, it's just asynchronous
   * and at the begin of the next call stack.
   *
   * @param {String} event event name
   * @param {Function} fn callback
   * @api public
   */

  EventEmitter.prototype.defer = function defer () {
    var self = this
      , args = arguments;

    if (inNode) {
      process.nextTick(function nextTick () {
        self.emit.apply(self, args);
      });
    } else {
      setTimeout(function nextTick () {
        self.emit.apply(self, args);
      }, 0);
    }

    return this;
  };

  /**
   * Provide aliases to common associated methods.
   */

  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.removeEventListener = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.addEventListener = EventEmitter.prototype.addListener;

  /**
   * The following methods are hidden behind a preference lock as they might
   * introduce a slight performance hit, so if you don't use this functionality
   * it will not affect your application.
   *
   * @param {Boolean} emit enable emit override
   * @api public
   */

  if (inNode) {
    exports = module.exports = function preferencelocked (emit) {
      if (!emit) return;

      /**
       * Backup of the existing event emitter.
       *
       * @type {Function}
       * @api public
       */

      var emitter = EventEmitter.prototype.emit;

      /**
       * Override the emit method so we can implement a catch all method.
       *
       * @param {String} event name of the event
       * @returns {Boolean} true if the event was emitted, false it wasn't
       * @api public
       */

      EventEmitter.prototype.emit = function emit (event) {
        // the build in emit returns true or false it was able to emit the event to
        // a listener
        if (!emitter.apply(this, arguments)) {
          if (event !== 'newListener') {
            emitter.apply(this, concat.apply(['uncaught'], arguments));
          }

          return false;
        }

        return true;
      };
    };

    /**
     * Library version.
     *
     * @type {String}
     * @api public
     */

    exports.version = '0.0.6';
  }
})();
