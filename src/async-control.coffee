{AsyncObservation} = require "./"

class AsyncControl extends AsyncObservation
  constructor: (@_experiment, fn, context, args) ->
    super(fn, context, args)

module.exports = AsyncControl