MUST_BE_FN = ""
MUST_BE_STR = ""
ONE_CONTROL = ""

assign = require "object-assign"

id = (v) -> v

class Base
  set: (prop, val) =>
    Object.defineProperty @, prop, {emumerable: true, value: val}
    @

class Experiment

  constructor: (name, init) ->
    self = this

    unless self instanceof Experiment
      return new Experiment name, init

    if typeof name isnt "string"
      throw new TypeError MUST_BE_STR

    if init? and not typeof init is "function"
      throw new TypeError MUST_BE_FN

    @_candidates = []
    @_metadata = {}
    @_results = {}
    @_clean = id
    @_name = name
    @_runs = []

    init?.call? @

  try: (fn) =>
    if @_control then throw new Error "Control function already established."
    @_control = fn
    @

  use: (fn) =>
    @_candidates.push fn
    @

  metadata: (obj) =>
    return @_metadata unless obj?
    assign @_metadata, obj
    @

  context: (obj) =>
    return @_context unless obj?
    @_context = obj
    @

  clean: (fn) =>
    return @_results.map @_clean unless fn
    @_clean = fn
    @

  run: (args...) =>
    unless @_control
      throw new Error "Can't run without a control function."

    control = new Control this, @_control, @_context, args
    ret = control.call()

    candidates = @_candidates.map (fn, i) =>
      run = new Candidate this, fn, @_context, args
      run.call()
      run.clean(@_clean)

    @_runs.push {control, candidates}

    ret



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

  clean: (fn) =>
    @_result = fn @_result
    @

class Control extends Trial
  constructor: (@_experiment, fn, context, args) ->
    super(fn, context, args)

class Candidate extends Trial
  cosntructor: (@_experiment, fn, context, args) ->
    super(fn, context, args)
    @_name = @_experiment.name



module.exports = Experiment
