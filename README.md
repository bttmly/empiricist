`Trial`

```
// type trial
{
  name: String
  trialId: String
  control: Observation,
  candidate: Observation
}
```

```
// type observation
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

- `error` maybe present for candidate observations
- `cbArgs` present for all async experiment observations



TODO:

- beforeRun
- docs

## Experiment Factories

Experiment factories wrap a control function (which should be the original code that is being refactored or replaced), and an optional candidate function. When called, the experiment should behave identically to the control function. However, internally it runs the candidate function *also*, as well as records things like execution time and return value of both.

Call `experiment` or `asyncExperiment` like so

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