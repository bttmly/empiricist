Observation = require "./observation"

class Control extends Observation
  constructor: (@_experiment, fn, context, args) ->
    super(fn, context, args)

module.exports = Control
