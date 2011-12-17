/**
 * Library dependencies
 */

var EventEmitter = process.EventEmitter
  , slice = Array.prototype.slice
  , concat = Array.prototype.concat;

/**
 * Apply the same callback to every
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
 * Small utility to use a object to assign EventEmitters
 *
 * @param {Object} events
 * @api public
 */

EventEmitter.prototype.multiple = function (events) {
  for (var event in events) {
    if (events.hasOwnProperty(event)) {
      this.on(event, events[event]);
    }
  }

  return this;
};

/**
 * Checks if the event is already added to the event emitter
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

    this._events[event].indexOf(fn) >= 0;
  }

  return false;
};

/**
 * Sets an idle timer for an event. If the event has not been emitted
 * within the timeframe specified, the callback is executed with the
 * supplied arguments
 *
 * @param {String} event name of the event
 * @param {Number} timeout number of ms of idle time allowed
 * @param {Function} fn callback
 * @param {Object} arg1 first of any arguments to include
 * @api public
 */

EventEmitter.prototype.idle = function idle () {
  var args = slice.call(arguments, 0)
    , event = args.shift()
    , timeout = args.shift()
    , fn = args.shift()
    , self = this;

  var callback = function () {
    self.removeListener(event, self.idle);

    var nargs = args.slice(0);
    nargs.unshift(event);

    fn.apply(self, nargs);
  };

  var timerId = setTimeout(callback, timeout);

  // remove the timeout and reset the idle timer in case of event
  this.once(event, function () {
    clearTimeout(timerId);

    args.unshift(fn);
    args.unshift(timeout);
    args.unshift(event);

    self.idle.apply(self, args);
  });
};


/**
 * The following methods are hidden behind a prefernce lock as they might
 * introduce a slight performance hit, so if you don't use this functionality
 * it will not affect your application.
 *
 * @param {Boolean} emit enable emit override
 * @api public
 */

exports = module.exports = function preferencelocked (emit) {
  if (!emit) return;
  /**
   * Backup of the existing event emitter
   *
   * @type {Function}
   * @api public
   */

  var emit = EventEmitter.prototype.emit;

  /**
   * Override the emit method so we can implement a catch all method.
   *
   * @param {String} event name of the event
   * @returns {Boolean} true if the event was emitted, false it wasn't
   * @api public
   */

  EventEmitter.prototype.emit = function emitter (event) {
    // the build in emit returns true or false it was able to emit the event to
    // a listener
    if (!emit.apply(this, arguments)) {
      if (event !== 'newListener')
        emit.apply(this, concat.apply(['uncaught'], arguments));

      return false;
    }

    return true;
  };
}

/**
 * Library version.
 */

exports.version = '0.0.3';
