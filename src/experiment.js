var assert = require("assert");


var experimentProto = require("./experiment-proto");
var {shouldRun, makeId} = require("./util");

function experimentFactory (name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert.equal(typeof init, "function", "If provided, init argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment (...args) {

    assert.equal(typeof experiment.control, "function", "Can't run experiment without control");

    var ctx = experiment._context || this;

    if (!shouldRun(experiment, args)) {
      return experiment.control.apply(ctx, args);
    }

    var options = {args, ctx, metadata: experiment._metadata};

    var controlOptions = Object.assign({
      fn: experiment.control,
      which: "control",
      args: args
    }, options);

    var args2 = experiment._beforeRun(args);

    var candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate",
      args: args2
    }, options);

    var trial = {
      name: name,
      id: makeId(),
      control: makeObservation(controlOptions),
      candidate: makeObservation(candidateOptions)
    };

    experiment._report(experiment._clean(trial));

    return trial.control.returned;
  };

  return experiment;
}

function makeObservation (options) {
  var {args, fn, which, metadata, ctx} = options

  console.log(which, args);

  var start = Date.now();

  var observation = {args, metadata};

  if (which === "candidate") {
    try {
      observation.returned = fn.apply(ctx, args);
    } catch (e) {
      observation.returned = null;
      observation.error = e;
    }
  } else {
    observation.returned = fn.apply(ctx, args);
  }

  observation.duration = Date.now() - start;
  return observation;
}

module.exports = experimentFactory;
