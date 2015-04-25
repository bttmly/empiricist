Experiment = require "./experiment"
AsyncControl = require "./async-control"
AsyncCandidate = require "./async-candidate"

class AsyncExperiment extends Experiment
  constructor: (name, init) -> 
    unless @ instanceof AsyncExperiment
      return new AsyncExperiment name, init

    @_complete = false

    super

  run: (args..., cb) =>

    self = this

    results = 
      candidates: new Array @_candidates.length

    control = new AsyncControl @, @_control, @_context, args

    finish = do =>
      count = self._candidates.length + 1
      controlArgs = null
      (innerArgs...) =>
        if innerArgs.length
          controlArgs = innerArgs
        count--
        if count is 0
          self._complete = true
          self._results.push results
          cb controlArgs...

    control.call (args...) ->
      results.control = args
      finish args...

    candidates = @_candidates.forEach (fn, i) =>
      run = new AsyncCandidate self, fn, self._context, args
      run.call (args...) ->
        results.candidates[i] = args
        finish()

      


module.exports = AsyncExperiment