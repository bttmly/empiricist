Observation = require "./observation"

class AsyncObservation extends Observation
  constructor: -> super
  
  call: (cb) =>

    self = this

    done = ->
      self._end = Date.now()
      self._duration = self._start - self._end
      cb.apply self._context, arguments

    args = @_args.concat cb
    @_start = Date.now()
    @_fn.apply @_context, args
      

module.exports = AsyncObservation