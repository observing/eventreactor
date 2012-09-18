/*globals define:true, EventEmitter:true */

/**!
 * EventReactor
 * @copyright (c) 2012 observe.it (observe.it) <opensource@observe.it>
 * MIT Licensed
 */
(function Modulize(name, definition, context) {
  "use strict";

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = definition.call(context);
  } else if (typeof context.define === 'function' && context.define.amd) {
    define(name, definition);
  } else {
    context[name] = definition.call(context);
  }
})('EventReactor', function EventReactorBootstrap() {
  "use strict";

  /**
   * Cached prototype lookups to improve performance.
   */
  var slice = Array.prototype.slice
    , concat = Array.prototype.concat;

  /**
   * The EventEmitter that we want to extend.
   *
   * @constructor
   * @api public
   */
  var EventEmitter = 'EventEmitter' in this
      ? EventEmitter
      : (typeof process !== 'undefined'
         ? process.EventEmitter
         : require('events').EventEmitter
        );

  /**
   * The EventReactor plugin that allows you to extend update the EventEmitter
   * prototype.
   *
   * @constructor
   * @param {Object} options
   * @param {Prototype} proto prototype that needs to be extended
   * @api public
   */
  function EventReactor(options, proto) {
    // allow initialization without a new prefix
    if (!(this instanceof EventReactor)) return new EventReactor(options, proto);

    options = options || {};
    this.restore = {};

    // don't attach the extra event reactor methods, we are going to apply them
    // manually to the prototypes
    if (options.manual) return this;

    var methods = EventReactor.generation
      , method;

    for (method in methods) {
      if (methods.hasOwnProperty(method)) {
        this[method](proto);
      }
    }

    // such as aliases and emit overrides
    this.aliases(proto);
    this.emit(proto);
  }

  /**
   * Add aliases to the EventEmitters.
   *
   * @param {EventEmitter} proto the proto that needs to be extended
   * @param {Boolean} force override if the method already exists
   * @returns {EventReactor}
   */
  EventReactor.prototype.aliases = function alias(proto, force) {
    proto = proto || EventEmitter.prototype;

    if (!('off' in proto) || force) {
      proto.off = proto.removeListener;
    }

    if (!('removeEventListener' in proto) || force) {
      proto.removeEventListener = proto.removeListener;
    }

    if (!('addEventListener' in proto) || force) {
      proto.addEventListener = proto.addListener;
    }

    return this;
  };

  /**
   * Override the `emit` method so we can add a uncaught event listener and
   * a listener that is called for each method.
   *
   * @param {EventEmitter} proto the proto that needs to be extended
   * @param {Boolean} force override if the method already exists
   * @returns {EventReactor}
   */
  EventReactor.prototype.emit = function emit(proto, force) {
    proto = proto || EventEmitter.prototype;

    if (!('off' in proto) || force) {
      proto.off = proto.removeListener;
    }

    var emitter = this.restore.emit = proto.emit;

    proto.emit = function emit(event) {
      var success = emitter.apply(this, arguments);

      // don't emit for the silly newListener event
      if (event === 'newListener') return success;

      // if this event isn't captured
      if (!success) emitter.apply(this, concat.apply(['uncaughtEvent'], arguments));

      // override the events
      emitter.apply(this, concat.apply(['*.*'], arguments));

      return success;
    };

    return this;
  };

  /**
   * Remove the EventReactor prototypes from the EventEmitter.
   *
   * @param {EventEmitter} proto the proto that needs to be extended
   * @param {Boolean} force override if the method already exists
   * @returns {EventReactor}
   */
  EventReactor.prototype.destroy = function destroy(proto, force) {
    var methods = EventReactor.generation
      , method;

    for (method in methods) {
      if (methods.hasOwnProperty(method) && this[method]) {
        delete this[method];

        // if we have a method we can restore, we are replied it back
        if (this.restore[method]) {
          methods[method] = this.restore[method];
          delete this.restore[method];
        }
      }
    }

    return this;
  };

  /**
   * Generate the EventReactor methods as there are some re-usable patterns
   * which we can apply to them.
   */
  Object.keys(EventReactor.generation = {
      /**
       * Apply the same callback to every given event.
       *
       * @param {String} .. events
       * @param {Function} callback last argument is always the callback
       * @api private
       */
      'every': function every() {
        for (
          var args = slice.call(arguments, 0)
            , callback = args.pop()
            , length = args.length
            , i = 0;

          i < length;
          this.on(args[i++], callback)
        ){}

        return this;
      }

      /**
       * One of the supplied event names can trigger the given event once.
       *
       * @note this method depends on the every method to be loaded.
       * @param {String} .. events
       * @param {Function} callback last argument is alwys the callback
       * @api private
       */
    , 'either': function either() {
        /**
         * Handler for all the calls so every remaining event listener is removed
         * removed properly before we call the callback.
         *
         * @api private
         */
        function handle() {
          for (
            var i = 0
              , length = args.length;

            i < length;
            self.removeListener(args[i++], handle)
          ){}

          // call the function as last as the function might be calling on of
          // events that where in our either queue, so we need to make sure that
          // everything is removed
          callback.apply(self, arguments);
        }

        var args = slice.call(arguments, 0)
          , callback = args.pop()
          , self = this;

        return this.every.apply(this, args.concat([handle]));
      }

      /**
       * Allow a object to be used to assign event listeners, the key as the
       * event name and the value as the event callback.
       *
       * @param {Object} events
       * @api private
       */
    , 'multiple': function multiple(events) {
        for (var event in events) {
          if (events.hasOwnProperty(event)) {
            this.on(event, events[event]);
          }
        }

        return this;
      }

      /**
       * Check if the event is already added to the event emitter.
       *
       * @param {String} event the name of the event
       * @param {Function} callback optional function that it should match
       * @return {Boolean}
       * @api private
       */
    , 'has': function has(event, callback) {
        var listeners = this.listeners(event);

        if (!callback) return !!listeners.length;
        return listeners.indexOf(callback) >= 0;
      }

      /**
       * Defer the emit until the current call stack is empty and the event
       * will be processed the on the next tick.
       *
       * @param {String} event
       * @param {Mixed} .. arguments that get applied to the function
       * @api private
       */
    , 'defer': new Function('event', [
          'var args = arguments, self = this;'
        , typeof process !== 'undefined' && 'nextTick' in process
            ? 'process.nextTick('
            : (typeof setImmediate !== 'undefined'
               ? 'setImmediate('
               : 'setTimeout('
              )
        , 'function(){ self.emit.apply(self, args) }, 0);'
        , 'return this;'
      ].join('\n'))

      /**
       * Delay the execution of the emit.
       *
       * @param {String} event
       * @param {Number} timeout
       * @api private
       */
    , 'delay': function delay(event, timeout) {
        var args = slice.call(arguments, 0)
          , self = this;

        // remove the time argument from the arguments array so we can apply the
        // arguments cleanly
        args.splice(1, 1);

        setTimeout(function timeout() {
          self.emit.apply(self, args);
        }, timeout);

        return this;
      }

      /**
       * Set an idle timer for the given event. If the event has not been
       * emitted within the given timeout, the callback will be called with
       * executed with the supplied arguments.
       *
       * @param {String} event
       * @param {Function} callback
       * @param {Number} timeout
       * @api private
       */
    , 'idle': function idle(event, callback, timeout) {
        var args = slice.call(arguments, 0).slice(3)
          , self = this
          , timer;

        /**
         * Handle the idle callback as the setTimeout got triggerd.
         *
         * @api private
         */
        function handle() {
          self.removeListener(event, reset);
          callback.apply(self, [event].concat(args));
        }

        /**
         * Reset the timeout timer again as the event was triggerd.
         *
         * @api private
         */
        function reset() {
          clearTimeout(timer);

          self.idle.apply(self, [event, callback, timeout].concat(args));
        }

        timer = setTimeout(handle, timeout || 1000);
        return this.once(event, reset);
      }

  }).forEach(function generate(key) {
    /**
     * @param {EventEmitter} proto the proto that needs to be extended
     * @param {Boolean} force override if the method already exists
     * @returns {EventReactor}
     */
    EventReactor.prototype[key] = function generatedProto(proto, force) {
      proto = proto || EventEmitter.prototype;

      // the every method already exists, and we don't want to override it
      if (key in proto) {
        if (!force) return this;
        this.restore[key] = proto[key];
      }

      proto[key] = EventReactor.generation[key];

      return this;
    };
  });

  /**
   * The EventReactor version.
   *
   * @type {String}
   * @api public
   */
  EventReactor.version = '0.1.0';
  return EventReactor;
}, this);
