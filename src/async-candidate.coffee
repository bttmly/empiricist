AsyncObservation = require "./async-observation"

class AsyncCandidate extends AsyncObservation
  constructor: (@_experiment, fn, context, args) ->
    super(fn, context, args)

module.exports = AsyncCandidate