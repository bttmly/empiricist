var assert = require("assert");

var experimentProto = require("./exp-ctx");

function experimentFactory (name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");
  assert.equal(typeof init, "function", "second argument must be a function");


  function experiment (...args) {
    if (typeof experiment.control !== "function") {
      throw new Error("Can't run experiment without control function.");
    }

    var ctx = experiment.context || this;

    // early return with no trial recording if no candidate or candidate not enabled
    if (!experiment.enabled()) {
      return experiment.control.apply(ctx, args);
    }

    function makeObservation (fn, context, args) {
      var start = Date.now();
      var observation = {name, args, metadata: experiment.metadata};
      observation.returned = fn.apply(context, args);
      observation.duration = Date.now() - start;
      return observation;
    }

    var trial = {
      control: makeObservation(experiment.control, ctx, args),
      candidate: makeObservation(experiment.candidate, ctx, args)
    };

    experiment.reporter(experiment.cleaner(trial));

    return trial.control.result;
  };

  Object.assign(experiment, experimentProto());

  init.call(experiment, experiment);

  return experiment;
}

module.exports = experimentFactory;
