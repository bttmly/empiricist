Observation = require "./observation"

class AsyncObservation extends Observation
  constructor: -> super
  
  call: (next) =>

module.exports = AsyncObservation