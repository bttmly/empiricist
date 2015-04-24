class Observation
  constructor: (fn, context, args) ->
    @_fn = fn
    @_args = args
    @_context = context

  call: =>
    @_start = Date.now()
    @_result = @_fn.apply @_context, @_args
    @_end = Date.now()
    @_duration = @_start - @_end
    @_result

  result: => @_result

  clean: (fn) =>
    @_result = fn @_result
    @

module.exports = Observation