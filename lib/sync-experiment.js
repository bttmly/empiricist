// const assign = require("object-assign");

"use strict";

var _require = require("./shared");

var experimentFactoryFactory = _require.experimentFactoryFactory;

var Trial = require("./trial");

// responsible for transforming observation parameters and an experiment into a trial
// should invoke
function createSyncTrial(_ref, exp) {
  var controlParams = _ref.controlParams;
  var candidateParams = _ref.candidateParams;

  var observations = [controlParams, candidateParams].map(makeSyncObservation);
  exp.emitTrial(new Trial(exp, observations));
  return observations[0].result;
}

// responsible for transforming one set of parameters into an observation
function makeSyncObservation(params) {
  var fn = params.fn;
  var ctx = params.ctx;
  var args = params.args;
  var metadata = params.metadata;
  var which = params.which;

  var observation = { args: args, metadata: metadata, type: which };
  var start = Date.now();

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

// createOptions,
// createExperimentFactory,