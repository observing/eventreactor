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
