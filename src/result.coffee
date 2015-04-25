class Result
  constructor: (@_control, @_candidates) ->

  compare: (a, b) -> a is b

  evaluate: ->
    @_candidates.map (c) => @compare @_control, c


module.exports = Result