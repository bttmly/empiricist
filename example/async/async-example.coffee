assert = require "assert"

{AsyncExperiment} = require "../../src"

exp = new AsyncExperiment "basic-example", ->

  @use (args..., cb) ->
    setTimeout ->
      cb null, args.reduce (x, y) -> x * y
    , 1000

  @try (args..., cb) ->
    setTimeout ->
      cb null, args.reduce (x, y) -> x + y
    , 2000

val = exp.run 1, 2, 3, 4, (err, result) ->
  assert.equal err, null
  assert.equal result, 24

  [r] = exp.results()

  assert.deepEqual r.control, [null, 24]
  assert.deepEqual r.candidates[0], [null, 10]

  console.log "Done!"