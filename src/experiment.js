let assert = require("assert");

let experimentProto = require("./experiment-proto");

let {
  isFunction,
  isString,
  shouldRun,
  makeId
} = require("./util");

function experimentFactory (name, init) {

  assert(isString(name), "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert(isFunction(init), "If provided, init argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment (...args) {

    assert(isFunction(experiment.control), "Can't run experiment without control");

    let ctx = experiment._context || this;

    if (!shouldRun(experiment, args))
      return experiment.control.apply(ctx, args);

    let options = {ctx, metadata: experiment._metadata};

    let controlOptions = Object.assign({
      fn: experiment.control,
      which: "control",
      args: args
    }, options);

    let candidateArgs = experiment._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    let candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    let trial = {
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
  let {args, fn, which, metadata, ctx} = options

  let start = Date.now(),
      observation = {args, metadata};

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
