var assert = require("assert");

var experimentContext = require("./exp-ctx");

function experiment (name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");
  assert.equal(typeof init, "function", "second argument must be a function");

  var params = {};

  var _experiment = experimentContext(params);

  init.call(_experiment, _experiment);

  function makeObservation (fn, context, args) {
    var start = Date.now();
    var observation = {name, args, metadata: params.metadata};
    observation.returned = fn.apply(context, args);
    observation.duration = Date.now() - start;
    return observation;
  }

  return function (...args) {
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
