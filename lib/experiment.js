"use strict";

var experimentContext = require("./exp-ctx");

function experiment(name, fn) {

  var params = {};

  var _experiment = experimentContext(params);

  fn.call(_experiment, _experiment);

  function makeObservation(fn, context, args) {
    var start = Date.now();
    var observation = { name: name, args: args, metadata: params.metadata };
    observation.returned = fn.apply(context, args);
    observation.duration = Date.now() - start;
    return observation;
  }

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (typeof params.control !== "function") {
      throw new Error("Can't run experiment without control function.");
    }

    var ctx = params.context || this;

    // early return with no trial recording if no candidate or candidate not enabled
    if (!_experiment.enabled()) {
      return params.control.apply(ctx, args);
    }

    var trial = {
      control: makeObservation(params.control, ctx, args),
      candidate: makeObservation(params.candidate, ctx, args)
    };

    params.reporter(params.cleaner(trial));

    return trial.control.result;
  };
}

module.exports = experiment;