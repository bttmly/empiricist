class Observation
  constructor: (fn, context, args) ->
    @_fn = fn
    @_args = args
    @_context = context

  call: =>
    @_start = Date.now()
    @_results = @_fn.apply @_context, @_args
    @_end = Date.now()
    @_duration = @_start - @_end
    @_result

  results: => @_results

  clean: (fn) =>
    @_results = fn @_results
    @

module.exports = Observation