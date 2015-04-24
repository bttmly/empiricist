{Experiment, AsyncControl, AsyncCandidate} = require "./"

class AsyncExperiment extends Experiment
  constructor: (name, init) -> 
    unless self instanceof AsyncExperiment
      return new AsyncExperiment name, init

    super

module.exports = AsyncExperiment