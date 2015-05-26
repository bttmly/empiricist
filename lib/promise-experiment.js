"use strict";

var _require = require("./shared");

var createOptions = _require.createOptions;
var createExperiment = _require.createExperiment;

var _require2 = require("./pkg-util");

var isThennable = _require2.isThennable;

function wrapPromiseExperiment(_exp) {
  var trial = { name: _exp.name, id: makeId() };
  var ctx = _exp._context || this;

  function experiment() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (!shouldRun(_exp, args)) {
      return _exp.control.apply(ctx, args);
    }

    var _createOptions = createOptions(_exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    var promises = [controlOptions, candidateOptions].map(makePromiseObservation);

    return Promise.all(promises).then(function (observations) {
      trial.control = observations[0];
      trial.candidate = observations[1];
      _exp._report(_exp._clean(trial));
      return trial.control.returned;
    });
  }

  assign(experiment, _exp.control);
  return experiment;
}

function makePromiseObservation(options) {
  var fn = options.fn;
  var trial = options.trial;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;

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

module.exports = createExperiment(wrapPromiseExperiment);