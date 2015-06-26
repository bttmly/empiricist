"use strict";

var assign = require("object-assign");

var _require = require("./shared");

var createOptions = _require.createOptions;
var createExperimentFactory = _require.createExperimentFactory;

var Trial = require("./trial");

function wrapPromiseExperiment(exp) {
  var ctx = exp._context || this;

  function experimentFunc() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (!exp.enabled(args)) {
      return exp.control.apply(ctx, args);
    }

    var _createOptions = createOptions(exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    var promises = [controlOptions, candidateOptions].map(makePromiseObservation);

    // I dont think this currently handles errors in the control properly
    return Promise.all(promises).then(function (observations) {
      var trial = new Trial(exp, observations);
      exp.emitTrial(trial);
      return trial.control.returned;
    });
  }

  assign(experimentFunc, exp.control);
  return experimentFunc;
}

function makePromiseObservation(options) {
  var fn = options.fn;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;

  var observation = { args: args, metadata: metadata };
  var start = Date.now();

  function onSuccess(d) {
    observation.returned = d;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  function onError(e) {
    observation.error = e;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  return fn.apply(ctx, args).then(onSuccess, onError);
}

module.exports = createExperimentFactory(wrapPromiseExperiment);