{equal} = require "assert"

assign = require "object-assign"

{Control, Candidate} = require "./"

MUST_BE_FN = ""
MUST_BE_STR = ""
ONE_CONTROL = ""

class Experiment
  
  id = (v) -> v

  constructor: (name, init) ->

    unless @ instanceof Experiment
      return new Experiment name, init

    equal typeof name, "string", MUST_BE_STR
    if init? then equal typeof init, "function", MUST_BE_FN

    @_candidates = []
    @_metadata = {}
    @_results = {}
    @_clean = id
    @_name = name
    @_runs = []

    init?.call? @

  use: (fn) =>
    if @_control then throw new Error "Control function already established."
    @_control = fn
    @

  try: (fn) =>
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

    control = new Control @, @_control, @_context, args
    ret = control.call()

    candidates = @_candidates.map (fn, i) =>
      run = new Candidate @, fn, @_context, args
      run.call()
      run.clean(@_clean)

    @_runs.push {control, candidates}

    ret


module.exports = Experiment
