# Empiricist

`empiricist` is a library for refactoring and profiling Node.js/io.js code. It is based on, and serves a purpose similar to, [github/scientist](https://github.com/github/scientist).

`empiricist` creates "experiments" – functions which wrap other functions. The original function (which is to be refactored), is called the _control_. The new behavior is called the _candidate_. The returned "experiment" function externally behaves like the control function. 

```js
var experiment = require("empiricist").syncExperiment;

function add (a, b) { return a + b; }
function multiply (a, b) { return a * b; }

var experimentalAdd = experiment("addition", function (e) {
  e.use(add)
  e.try(multiply);
});

experimentalAdd(2, 3); // returns 5
```

Here, `experimentalAdd` behaves like `add`. However, when called, it also runs the candidate (`multiply`), and also does a few other (configurable) things as well.

## Usage

`empiricist` contains experiment "factories", one for synchronous functions and one for asynchronous ones. These factories are implemented using the [revealing constructor pattern](https://blog.domenic.me/the-revealing-constructor-pattern/). This enables a degree of extensibility while also providing certain confirguation and privacy guarantees.

```coffeescript
{syncExperiment} = require "empiricist"

experimentalAdd = syncExperiment "test", ->
  @use (a, b) -> a + b
  @try (a, b) -> a * b

experimentalAdd 2, 3 # returns 5
```

`epiricist` uses the . Calls to `syncExperiment` and `asyncExperiment` return functions (since they wrap functions), but during initialization an underlying `Experiment` object is exposed to the executor to allow the caller to configure the experiment, while leaving the returned experiment function as externally similar to the control function as possible. This helps ensure calling code cannot become coupled to a hypothetical experiment interface.

### Top Level Namespace

#### `syncExperiment(String name, Function<Experiment exp> executor) -> Function`

Creats an experiment wrapping a synchronous 'control' function.

#### `asyncExperiment(String name, Function<Experiment exp> executor) -> Function`

Creates an experiment wrapping an asychronous 'control' function.

#### The Difference

If you are unfamiliar with the single-threaded, callback-based IO model of Node.js/io.js, the distinction between synchronous and asynchronous functions is crucial. Synchronous functions return values and throw exceptions just as you expect in other languages. In contrast, _asynchronous_ functions don't (generally) return or throw _anything_. Instead, they receive a callback function as their final argument, and when whatever IO they are performing finishes, they provide an error or result to the callback as arguments. When using `empiricist` it is important to wrap a function with the appropriate factory for the type of control function you are using.

#### `new Experiment()`

Creates a bare experiment instance. This constructor is exported primarily to enable subclassing and injection (which has not yet been implemented).

### Experiment API

During initialization, experiment factories expose an underlying `Experiment` instance to the executorthat is used for configuration. This object's `use()` method **must** be called with a function. The instance methods of Experiments are below. All methods return the instance for chaining.

**Important**: This object is available within the executor, it is not returned from the function call to `syncExperiment` or `asyncExperiment`. Those functions return normal JavaScript function objects that behave like the configured control function.

#### `.use(Function control) -> Experiment`
`use` sets the 'control behavior' of an experiment. This should be the original function that is being refactored or replaced. This method must be called properly in the executor or an exception will be thrown.

#### `.try(Function candidate) -> Experiment`
`try` sets the 'candidate behavior' of an experiment. This should be the function that is being developed to replace the 'control behavior'.

#### `.enabled(Function<Array args> isEnabled) -> Experiment`
`enabled` sets the experiment's internal function that decides whether or not the candidate function should run. For instance, to run the candidate 1% of the time, one might do:

```js
exp.enabled(function () { return Math.random() < 0.01; });
```

The enabled function is called with the original calling arguments. 

#### `.report(Function reporter) -> Experiment`

Expected signature of `reporter` argument:

`reporter(Object observation) -> Undefined`

#### `.clean(Function cleaner) -> Experiment`

Expected signature of `cleaner` argument:

`cleaner(Object observation) -> Object`

#### `.beforeRun(Function<Array args> setup) -> Experiment`

`setup` must return an `Array`.

The `setup` function is passed the calling arguments as an array, and must return an array. The candidate function will be called with the result of `setup` rather than the original arguments. This is helpful particularly in the case where an algorithm mangles an object in place since the candidate should receive a clone rather than the original. The function is only called if the candidate will run.

#### `.metadata(Object data) -> Experiment`
Experiment objects maintain an internal metadata object that is attached to the results of each trial. The `metadata` method merges it's argument into the experiment's internal metadata. This is useful for adding context to trials; for instance, the version of Node (`process.version`) or other platform features.

#### `context(Any thing) -> Experiment`



### Internal Data Types

The configurable `cleaner` and `reporter` functions interact with data of the following shapes

The Trial type is a struct with the following shape

```
{
  name: String
  id: String
  control: Observation,
  candidate: Observation
}
```

The Observation type is contained in Trials, and is a struct with the following shape

```
// type Observation
{
  type: Enum{"control", "candidate"}
  returned: Any
  duration: Number
  metadata: Object
  args: Array
  threw: Error?
  cbArgs: Array?
}
```

### Handling Writes

One issue with running code two functions intended to do the same thing side-by-side is dealing with persistence. The candidate function should probably not be writing to your normal production database, for instance. A possible solution is to use an alternate database for candidate code, while the original code continues to write to the production database. Then, the contents of the scratch database can be verified independently.

```js
var exp = experiment("with-writes", function (e) {
  e.use(function (userData, callback) {
    prodDb.users.insert(userData, callback);
  });

  e.try(function (userData, callback) {
    scratchDb.users.insert(userData, callback);
  });
})
```

Alternately, the data layer could be written such that it can handle this via options. Then, the `beforeRun` hook can add the option, which keeps the candidate code pristine.

```js
var _ = require("lodash");

var exp = experiment("with-writes", function (e) {
  e.use(function (userData, options, callback) {
    new OldUserModel(userData).insert(options, callback);
  });

  e.try(function (userData, options, callback) {
    new NewUserModel(userData).insert(options, callback);
  });

  e.beforeRun(function (userData, options, callback) {
    var newOptions = _.defaults({useScratchDb: true}, options);
    return [userData, newOptions, callback];
  });
});

```

To do:

- [ ] Increased safety features in executor. Call-at-most-once / call-exactly-once semantics for some methods like `use` and `try` might be nice.
- [ ] Investigate performance hit, edge cases RE: prototype swapping
- [ ] Consider if to allow user subclassing of Experiment, and how to allow constructor injection. This would allow consumers to extend the library while maintaining most encapsulation guarantees.
- [ ] Consider how to DRY up repeated code between `syncExperiment` and `asyncExperiment`
- [ ] Better rescuing / stuff to avoid thrown errors from configured functions
- [ ] Function renaming? How close is close enough to the control?
- [ ] Promise experiment factory
