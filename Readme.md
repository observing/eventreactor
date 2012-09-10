# EventReactor, EventEmitters on a sugar rush

Build status: [![BuildStatus](https://secure.travis-ci.org/observing/eventreactor.png?branch=master)](http://travis-ci.org/observing/eventreactor)

EventReactor adds additional syntax sugar on top of your existing EventEmitters.
It works on top of every EventEmitter inspired module, even EventEmitter2. The
EventReactor was created to migrate repeating patterns when working
EventEmitters.

## New methods, API

Before you can use the EventReactor you have to initialize it. This can be done
by simply calling `new EventReactor()`. This will extend the default `EventEmitter`.
If you don't want the EventEmitter to automatically extend the build-in
EventEmitter or only want to use a subset of it's functionality you should
supply the constructor with the `manual` option.

```js
var ER = new EventReactor({ manual: true });
```

When you invoke the EventReactor using the `manual` you need to manually attach
the EventReactor methods to the `prototype` of your choosing, for example adding
the EventReactor methods to the EventEmitter2 module.

```js
var EventReactor = require('eventreactor')
  , EventEmitter2 = require('eventemitter2').EventEmitter2;

var ER = new EventReactor({ manual: true });

ER.aliases(EventEmitter2.prototype);
ER.every(EventEmitter2.prototype);
ER.either(EventEmitter2.prototype);
ER.multiple(EventEmitter2.prototype);
ER.has(EventEmitter2.prototype);
ER.defer(EventEmitter2.prototype);
ER.delay(EventEmitter2.prototype);
ER.idle(EventEmitter2.prototype);
ER.emit(EventEmitter2.prototype);
```

If you want to remove the EventReactor extensions you can call the destroy
method. It should return the old and potentially overriden methods.

```js
ER.destroy(EventEmitter2.prototype);
```

### EventEmitter.every(event, event, event, callback);

Applies the same callback for all the given events. It expects that the callback
is the last argument of the function and that all other arguments are the name
of the events you want to listen on.

#### Example
You find your self applying the same error handling for timeouts, errors and
other error related events. This cleans up your code nicely

```js
EventEmitter.every('error', 'timeout', function (e) {
 console.error('(error) ', e.message);
});
```

### EventEmitter.has(event, fn);

Check if the EventEmitter already has this function applied, if your code has
multiple parts on where events can be added to your event emitter you might want
to check if it's not added already. This simple helper function returns true or
false.

#### Example

```js
function example () {};

if (!EventEmitter.has('example', example)) {
  EventEmitter.on('example', example);
}
```

### EventEmitter.multiple({object});

Sometimes you need to add a lot of event listeners for example when you create a
net.Connection. You need to listener for error, close, connect, data, timeout
and maybe even for end. That is a lot of events.

Or maybe you are already used to a observer patterns that used objects for
listening instead of eventlistener based layout. Anyways, we got you covered.

#### Example

```js
EventEmitter.multiple({
    error: function () { .. }
  , timeout: function () { .. }
  , connect: function () { .. }
  , close: function () { .. }
});
```

### EventEmitter.idle(event, timeout, callback /*, argument1, argument2 ... */);

Sometimes you want to know when an event has not been fired within a specified
time period.  You can set an idle timer that fires off a callback for you if the
event has gone missing.  Once fired, the event will remove itself for you, so
don't forget to set it back up after your events start up again.

Don't worry, like a good idle timer, it will reset itself when the event has
been fired before the timeout has occurred.

#### Example

```js
function callback (event) {
  console.log(event + " was never fired");
}

EventEmitter.idle("timeout", 100, callback);
```

### EventEmitter.delay(event, timeout /*, argument1, argument2 .. */);

Delays the emitting of the given event. Much like setTimeout invokes the
function after xxx miliseconds.

#### Example

```js
EventEmitter.on('foo', function (arg, arg1) {
  console.log('args: ', arguments);
});

EventEmitter.delay('foo', 1000, 'arg1', 'arg2');
```

### EventEmitter.defer(event /*, argument1, argument2 .. */);

Defers the emitting of the event until the current call stack has been cleared.
Simular to wrapping an emit in a `process.nextTick`.

#### Example

```js
EventEmitter.on('pewpew', function () {
  console.log('called second', arguments);
});

EventEmitter.defer('pewpew', 1, 2, 3);

console.log('called first');
```

### Uncaught events and the any listeners

The EventReactor allows you to listen for unlistened events. These events are
re-emitted under the `uncaughtEvent` event name. In addition to this, every
emitted event is re-emitted under the `*.*` event name. This can be useful for
debugging or logging your events.

Because these features overrides the `emit` method, they are not added by
default. If you want to leverage these events you need to call the
`EventReactor#emit` method.

#### Example

```js
// we assume that ER is your EventReactor instance.
ER.emit();

EventEmitter.on('uncaughtEvent', function (event, data) {
  console.log('no listeners for', event, data);
});

EventEmitter.on('*.*', function () {
  console.log('pew pew, captured);
});

EventEmitter.emit('random name');
```

### Aliases

- `EventEmitter.off` -> `EventEmitter.removeListener`
- `EventEmitter.removeEventListener` -> `EventEmitter.removeListener`
- `EventEmitter.addEventListener` -> `EventEmitter.addListener`
