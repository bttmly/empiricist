const assign = require("object-assign");

const {createOptions, createExperimentFactory} = require("./shared");
const Trial = require("./trial");

function wrapSyncExperiment (exp) {

  function experimentFunc (...args) {

    const ctx = exp.contextWasSet ? exp.context : this;

    if (!exp.enabled(...args)) {
      return exp.control.apply(ctx, args);
    }

    const {controlOptions, candidateOptions} = createOptions(exp, args, ctx);
    const observations = [makeSyncObservation(controlOptions), makeSyncObservation(candidateOptions)];
    const trial = new Trial(exp, observations);
    exp.emitTrial(trial);
    return trial.control.result;
  }

  assign(experimentFunc, exp.control);
  return experimentFunc;
}

function makeSyncObservation (options) {
  const {fn, ctx, args, metadata, which} = options;
  const observation = {args, metadata, type: which};
  const start = Date.now();

  if (which === "candidate") {
    try {
      observation.result = fn.apply(ctx, args);
    } catch (e) {
      observation.result = null;
      observation.error = e;
    }
  } else {
    observation.result = fn.apply(ctx, args);
  }

  observation.duration = Date.now() - start;
  return observation;
}


module.exports = createExperimentFactory(wrapSyncExperiment);
