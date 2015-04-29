var assert = require("assert");

var experimentProto = require("./experiment-proto");

function experimentFactory (name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");
  
  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert.equal(typeof init, "function", "second argument must be a function");
    init.call(experiment, experiment);
  }

  function shouldRun () {
    return (
      typeof experiment.candidate === "function" &&
      experiment._enabled()
    );
  }

  function experiment (...args) {
    if (typeof experiment.control !== "function") {
      throw new Error("Can't run experiment without control function.");
    }

    var ctx = experiment._context || this;

    // early return with no trial recording if no candidate or candidate not enabled
    if (!shouldRun()) {
      return experiment.control.apply(ctx, args);
    }

    function makeObservation (fn, context, args, options) {
      var start = Date.now();
      var observation = {name, args, metadata: experiment._metadata};

      if (options.which === "candidate") {
        try {
          observation.returned = fn.apply(context, args);
        } catch (e) {
          observation.returned = null;
          observation.error = e;
        }
      } else {
        observation.returned = fn.apply(context, args);
      }

      observation.duration = Date.now() - start;
      return observation;
    }

    var trial = {
      control: makeObservation(experiment.control, ctx, args, {which: "control"}),
      candidate: makeObservation(experiment.candidate, ctx, args, {which: "candidate"})
    };

    experiment._report(experiment._clean(trial));

    return trial.control.returned;
  };

  return experiment;
}

module.exports = experimentFactory;
