# EventReactor

I could have come up with a lame name like `eventemitters`, `eventemitter3` or
`event`. But I decided not to do that and just go with something completely
odd.

But what does it do? I add some additional syntax suger on top of the existing
EventEmitter's in node.js. They are all nice pretty, but when you are working
with loads of events you find your self repeating the same things over and over
again.. wondering if it couldn't be simpler than that.

### The new methods

1. EventEmitter.every(event, event, event, callback);

> Applies the same callback for all the given events. It expects that the
> callback is the last argument of the function and that all other arguments
> are the name of the events you want to listen on.
>
> ### example
> You find your self applying the same error handling for timeouts, errors and
> other error related events. This cleans up your code nicely
>
> ```js
> var EventEmitter = process.EventEmitter;
> require('eventreactor');
>
> var EE = new EventEmitter;
> EE.every('error', 'timeout', function (e) {
>  console.error('(error) ', e.message);
> });
> ```

2. EventEmitter.has(event, fn);

> Check if the EventEmitter already has this function applied, if your code has
> multiple parts on where events can be added to your event emitter you might
> want to check if it's not added already. This simple helper function returns
> true or false.
>
> #### example
>
> ```js
> // same init as above
> var EE = new EventEmitter;
>
> function example () {};
>
> if (!EE.has('example', example)) {
>   EE.on('example', example);
> }
> ```

3. EventEmitter.multiple({object});

> Sometimes you need to add a lot of event listeners for example when you
> create a net.Connection. You need to listener for error, close, connect,
> data, timeout and maybe even for end. That is a lot of events.
>
> Or maybe you are already used to a observer patterns that used objects for
> listening instead of eventlistener based layout. Anyways, we got you covered.
>
> ### example
>
>```js
> // same init as first example
> var EE = new EventEmitter;
>
> EE.multiple({
>     error: function () { .. }
>   , timeout: function () { .. }
>   , connect: function () { .. }
>   , close: function () { .. }
> });
> ```

