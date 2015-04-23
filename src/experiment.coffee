MUST_BE_FN = ""
MUST_BE_STR = ""
ONE_CONTROL = ""

assign = require "object-assign"

class Experiment
  constructor: (@name, init) ->
    unless @ instanceof Experiment
      return new Experiment name, init

    if typeof @name isnt "string"
      throw new TypeError MUST_BE_STR

    if init? and not typeof init is "function"
      throw new TypeError MUST_BE_FN

    @_candidates = []
    @_metadata = {}
    @_results = {}
    @_clean = ->
    @_runs = []

    init?.call? @

  try: (candidateFn, init) =>
    return this

  use: (controlFn, init) =>
    return this

  metadata: (obj) =>
    return @_metadata unless obj?
    assign @_metadata, obj
    return this

  context: (obj) =>
    return @_context unless obj?
    @_context = obj
    return this

  clean: (fn) =>
    return @_results.map @_clean unless fn
    @_clean = fn
    return this

  run: (args...) =>
    unless @_control
      throw new Error "Can't run without a control function."

    control = bindApply @_control, @_context, args



    toInvoke = [@_control].concat(@_candidates)
      .map (fn) -> new Run bindApply fn, @_context, args

    run = new Run(args)

class Run
  constructor: (@_fn) ->

  call: =>
    @_start = Date.now()
    result = @_fn()
    @_end = Date.now()
    @_duration = @_start - @_end
    result

class Control
  constructor: ->




class Candidate

module.exports = Experiment
