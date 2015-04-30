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

Only interact with `experiment` objects through their public interface, which consists of the following methods. The `experiment` is itself a function and should be called just as the control function would be.

#### `use(Function control) => Experiment self`

#### `try(Function candidate) => Experiment self`

#### `enabled(Function isEnabled) => Experiment self`

#### `report(Function reporter) => Experiment self`

#### `clean(Function cleaner) => Experiment self`

#### `beforeRun(Function setup) => Experiment self`

#### `metadata(Object data) => Experiment self`

#### `context(Any thing) => Experiment self`


### Async Gotchas



### Internal Data Types


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