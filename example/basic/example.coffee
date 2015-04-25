{Experiment} = require "../../src"

exp = new Experiment "basic-example", ->

  @use (args...) ->
    args.reduce (x, y) -> x * y

  @try (args...) ->
    args.reduce (x, y) -> x + y

val = exp.run(1, 2, 3, 4)

[result] = exp._results

console.log result.evaluate()


