MUST_BE_FN = ""
MUST_BE_STR = ""
ONE_CONTROL = ""

assign = require "object-assign"



class Experiment
  constructor: (@name, init) ->
    self = this

    unless self instanceof Experiment
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

    @Trial = class Trial

    @Control = class Control extends Trial

    @Candidate = class Candidate extends Trial

  try: (fn) =>
    @_control = fn
    return this

  use: (fn) =>
    @_candidates.push fn
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

    control = new Control this, @_control, @_context, args
    control.call()

    candidates = @_candidates.map (fn, i) =>
      run = new Candidate this, fn, @_context, args
      run.call()
      run

    @_runs.push {control, candidates}

    control.result()



class Trial
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



class Control extends Trial
  constructor: (experiment, fn, context, args) ->
    super(fn, context, args)



class Candidate extends Trial
  cosntructor: (experiment, fn, context, args) ->
    super(fn, context, args)



module.exports = Experiment
