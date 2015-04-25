Experiment = require "./experiment"
AsyncControl = require "./async-control"
AsyncCandidate = require "./async-candidate"

console.log "Experiment", typeof Experiment
console.log "AsyncControl", typeof AsyncControl
console.log "AsyncCandidate", typeof AsyncCandidate

class AsyncExperiment extends Experiment
  constructor: (name, init) -> 
    unless @ instanceof AsyncExperiment
      return new AsyncExperiment name, init

    @_complete = false

    super

  run: (args..., cb) =>
    results = 
      candidates: new Array @_candidates.length

    control = new AsyncControl @, @_control, @_context, args
    
    self = this

    finish = do =>
      count = @_candidates.length + 1
      controlArgs = null
      (args...) ->

        console.log 'finish', count

        if args.length
          controlArgs = args
        count--
        if count is 0
          self._complete = true
          cb controlArgs...

    control.call (args...) ->
      results.control = args
      finish args...

    candidates = @_candidates.forEach (fn, i) =>
      run = new AsyncCandidate @, fn, @_context, args
      run.call (args...) ->
        candidates[i] = args
        finish()

      


module.exports = AsyncExperiment