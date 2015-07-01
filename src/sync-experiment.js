// const assign = require("object-assign");

const {
  // createOptions,
  // createExperimentFactory,
  experimentFactoryFactory
} = require("./shared");

const Trial = require("./trial");


// responsible for transforming observation parameters and an experiment into a trial
// should invoke
function createSyncTrial ({controlParams, candidateParams}, exp) {
  const observations = [controlParams, candidateParams].map(makeSyncObservation);
  exp.emitTrial(new Trial(exp, observations));
  return observations[0].result;
}

// responsible for transforming one set of parameters into an observation
function makeSyncObservation (params) {
  const {fn, ctx, args, metadata, which} = params;
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


module.exports = experimentFactoryFactory(createSyncTrial);
