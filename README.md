`Trial`

```
{
  control: Observation,
  candidate: Observation
}
```

`Observation`
{
  returned: Any
  duration: Number
  name: String
  metadata: Object
  args: Array
  cbArgs: Array?
}

(`cbArgs` only present for asyncExperiment observations)