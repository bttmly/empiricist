# Empiricist

Experiment factories wrap a control function (which should be the original code that is being refactored or replaced), and an optional candidate function. When called, the experiment should behave identically to the control function. However, internally it runs the candidate function *also*, as well as records things like execution time and return value of both.

Usage:

```js
var experiment = require("empiricist").syncExperiment;

function add (a, b) { return a + b; }
function multiply (a, b) { return a * b; }

var experimentalAdd = experiment("test", function (e) {
  e.use(add)
  e.try(multiply);
});

experimentalAdd(2, 3); // returns 5, but runs both `add` and `multiply` and reports info on them

```

The `executor` function gets the new experiment both as `this` context and as an argument. This is particularly becuase it tends to look nice in CoffeeScript. Properly initializing an experiment with at least a control function is important; failing to properly set up an experiment in the executor will cause an exception.

```coffeescript
{syncExperiment} = require "empiricist"

experimentalAdd = syncExperiment "test", ->
  @use (a, b) -> a + b
  @try (a, b) -> a * b

experimentalAdd 2, 3 # returns 5

```

`epiricist` uses the [revealing constructor pattern](https://blog.domenic.me/the-revealing-constructor-pattern/). Calls to `syncExperiment` and `asyncExperiment` return functions (since they wrap functions), but during initialization an underlying `Experiment` object is exposed to the executor to allow the caller to configure the experiment, while leaving the returned experiment function as externally similar to the control function as possible. This helps ensure calling code cannot become coupled to a hypothetical experiment interface.

#### `experiment(String name, Function executor)`




### `Experiment` instance methods

During initialization, both `syncExperiment` and `asyncExperiment` expose an underlying `Experiment` instance that is used for configuration. This object's `use()` method **must** be called with a function. The instance methods of Experiments are below. All methods return the instance for chaining.

**Important**: This object is available within the executor, it is not returned from the function call to `syncExperiment` or `asyncExperiment`. Those functions return normal JavaScript function objects that behave like the configured control function.

#### `use(Function control) => Experiment self`
`use` sets the 'control behavior' of an experiment. This should be the original function that is being refactored or replaced. This method must be called properly in the executor or an exception will be thrown.

#### `try(Function candidate) => Experiment self`
`try` sets the 'candidate behavior' of an experiment. This should be the function that is being developed to replace the 'control behavior'.

#### `enabled(Function isEnabled) => Experiment self`
`enabled` sets the experiment's internal function that decides whether or not the candidate function should run. For instance, to run the candidate 1% of the time, one might do:

```js
exp.enabled(function () { return Math.random() < 0.01; });
```

The enabled function is called with the original calling arguments. 

#### `report(Function reporter) => Experiment self`

Expected signature of `reporter` argument: 

`reporter :: Object -> Void`

#### `clean(Function cleaner) => Experiment self`

Expected signature of `cleaner` argument: 

`cleaner :: Object -> Object`

#### `beforeRun(Function setup) => Experiment self`

Expected signature of `setup` argument:

`setup :: Array -> Array`

The `setup` function is passed the calling arguments as an array, and must return an array. The candidate function will be called with the result of `setup` rather than the original arguments. This is helpful particularly in the case where an algorithm mangles an object in place since the candidate should receive a clone rather than the original. The function is only called if the candidate will run.

#### `metadata(Object data) => Experiment self`
Experiment objects maintain an internal metadata object that is attached to the results of each trial. The `metadata` method merges it's argument into the experiment's internal metadata. This is useful for adding context to trials; for instance, the version of Node (`process.version`) or other platform features.

#### `context(Any thing) => Experiment self`


### Async Gotchas



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
- [ ] Function renaming? How close is close enough to the control?
