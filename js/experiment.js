var experimentContext = require("./exp-ctx");

function experiment (name, fn) {

  var params = {};

  var _experiment = experimentContext(params);

  fn.call(_experiment, _experiment);

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

    // early return with no trial recording if no candidate
    if (!_experiment.enabled()) {
      return params.control.apply(ctx, args);
    }

    var trial = {
      control: makeObservation(params.control, ctx, args),
      candidate: makeObservation(params.candidate, ctx, args)
    };

    params.reporter(params.clean(trial));

    return trial.control.result;
  };
}

module.exports = experiment;
