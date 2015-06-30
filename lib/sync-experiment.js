"use strict";

var assign = require("object-assign");

var _require = require("./shared");

var createOptions = _require.createOptions;
var createExperimentFactory = _require.createExperimentFactory;

var Trial = require("./trial");

function wrapSyncExperiment(exp) {

  function experimentFunc() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var ctx = exp.contextWasSet ? exp.context : this;

    if (!exp.enabled.apply(exp, args)) {
      return exp.control.apply(ctx, args);
    }

    var _createOptions = createOptions(exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    var observations = [makeSyncObservation(controlOptions), makeSyncObservation(candidateOptions)];
    var trial = new Trial(exp, observations);
    exp.emitTrial(trial);
    return trial.control.result;
  }

  assign(experimentFunc, exp.control);
  return experimentFunc;
}

function makeSyncObservation(options) {
  var fn = options.fn;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;

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

module.exports = createExperimentFactory(wrapSyncExperiment);