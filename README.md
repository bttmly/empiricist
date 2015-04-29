`Trial`

```
{
  control: Observation,
  candidate: Observation
}
```

`Observation`

```
{
  type: Enum{"control", "candidate"}
  returned: Any
  duration: Number
  name: String
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
- try/catch/err reporting
- docs
