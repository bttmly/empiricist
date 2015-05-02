# Empiricist

Experiment factories wrap a control function (which should be the original code that is being refactored or replaced), and an optional candidate function. When called, the experiment should behave identically to the control function. However, internally it runs the candidate function *also*, as well as records things like execution time and return value of both.

Usage:

```js
var experiment = require("empiricist").experiment;

function add (a, b) { return a + b; }
function multiply (a, b) { return a * b; }

var exp = experiment("test", function (e) {
  e.use(add);
  e.try(multiply);
});

exp(2, 3) // returns 5, but runs both `add` and `multiply` and reports info on them

```

The `init` function gets the new experiment both as `this` context and as an argument. This is particularly becuase it tends to be nicer in CoffeeScript.

```coffeescript
{experiment} = require "empiricist"

exp = experiment "test", ->
  @use (a, b) -> a + b
  @try (a, b) -> a * b

exp 2, 3 # returns 5

```

#### `experiment(String name, Function init)`




### `experiment` and `asyncExperiment` methods

Only interact with `experiment` objects through their public interface, which consists of the following methods. The `experiment` is itself a function and should be called just as the control function would be. Asynchronous functions should use the `asyncExperiment` factory.

#### `use(Function control) => Experiment self`
`use` sets the 'control behavior' of an experiment. This should be the original function that is being refactored or replaced.

#### `try(Function candidate) => Experiment self`
`try` sets the 'candidate behavior' of an experiment. This should be the function that is being developed to replace the 'control behavior'.

#### `enabled(Function isEnabled) => Experiment self`
`enabled` sets the experiment's internal function that decides whether or not the candidate function should run. For instance, to run the candidate 1% of the time, one might do:

```js
exp.enabled(function () { return Math.random() < 0.01; });
```

The enabled function is called with the original calling arguments. 

#### `report(Function reporter) => Experiment self`

#### `clean(Function cleaner) => Experiment self`

#### `beforeRun(Function setup) => Experiment self`
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
  error: Error?
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
});
```

