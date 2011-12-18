# EventReactor, EventEmitters on a sugar rush

Build status: [![BuildStatus](https://secure.travis-ci.org/observing/eventreactor.png)](http://travis-ci.org/observing/eventreactor)

I could have come up with a lame name like `eventemitters`, `eventemitter3` or
`event`. But I decided not to do that and just go with something completely odd.

But what does it do? I add some additional syntax suger on top of the existing
EventEmitter's in node.js. They are all nice pretty, but when you are working
with loads of events you find your self repeating the same things over and over
again.. wondering if it couldn't be simpler than that.

## New methods, API

1. EventEmitter.every(event, event, event, callback);

Applies the same callback for all the given events. It expects that the callback
is the last argument of the function and that all other arguments are the name
of the events you want to listen on.

#### example
You find your self applying the same error handling for timeouts, errors and
other error related events. This cleans up your code nicely

```js
var EventEmitter = process.EventEmitter;
require('eventreactor');

var EE = new EventEmitter;
EE.every('error', 'timeout', function (e) {
 console.error('(error) ', e.message);
});
```

2. EventEmitter.has(event, fn);

Check if the EventEmitter already has this function applied, if your code has
multiple parts on where events can be added to your event emitter you might want
to check if it's not added already. This simple helper function returns true or
false.

#### example

```js
// same init as above
var EE = new EventEmitter;

function example () {};

if (!EE.has('example', example)) {
  EE.on('example', example);
}
```

3. EventEmitter.multiple({object});

Sometimes you need to add a lot of event listeners for example when you create a
net.Connection. You need to listener for error, close, connect, data, timeout
and maybe even for end. That is a lot of events.

Or maybe you are already used to a observer patterns that used objects for
listening instead of eventlistener based layout. Anyways, we got you covered.

#### example

```js
// same init as first example
var EE = new EventEmitter;

EE.multiple({
    error: function () { .. }
  , timeout: function () { .. }
  , connect: function () { .. }
  , close: function () { .. }
});
```

4. EventEmitter.idle(event, timeout, callback /*, argument1, argument2 ... */);

Sometimes you want to know when an event has not been fired within a specified
time period.  You can set an idle timer that fires off a callback for you if the
event has gone missing.  Once fired, the event will remove itself for you, so
don't forget to set it back up after your events start up again.

Don't worry, like a good idle timer, it will reset itself when the event has
been fired before the timeout has occurred.

#### example

```js
// same init as first example
var EE = new EventEmitter;

function callback (event) {
  console.log(event + " was never fired");
}

EE.idle("timeout", 100, callback);
```

5. EventEmitter.delay(event, timeout /*, argument1, argument2 .. */);

Delays the emitting of the given event. Much like setTimeout invokes the
function after xxx miliseconds.

#### example

```js
var EE = new EventEmitter;

EE.on('foo', function (arg, arg1) {
  console.log('args: ', arguments);
});

EE.delay('foo', 1000, 'arg1', 'arg2');
```

6. EventEmitter.defer(event /*, argument1, argument2 ..*/);

Defers the emitting of the event until the current call stack has been cleared.
Simular to wrapping an emit in a `process.nextTick`.

#### example

```js
var EE = new EventEmitter;

EE.on('pewpew', function () {
  console.log('called second', arguments);
});

EE.defer('pewpew', 1, 2, 3);

console.log('called first');
```

### Aliases

`EventEmitter.off` -> `EventEmitter.removeListener`
`EventEmitter.removeEventListener` -> `EventEmitter.removeListener`
`EventEmitter.addEventListener` -> `EventEmitter.addListener`
