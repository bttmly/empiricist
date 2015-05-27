const assert = require("assert");

const assign = require("object-assign");

const Experiment = require("./experiment-redux");
const {isFunction, isString} = require("util");

function createExperimentFactory (wrapper, Ctor) {

  Ctor = Ctor || Experiment

  return function (name, executor) {

    assert(isString(name), `'name' argument must be a string, found ${name}`);
    assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

    const experiment = new Ctor(name);

    executor.call(experiment, experiment);

    Ctor.assertValid(experiment);

    return wrapper(experiment);
  };

}

function createOptions (experiment, args, ctx) {

  const options = {
    ctx: ctx,
    metadata: experiment._metadata,
  };

  const controlOptions = assign({
    fn: experiment.control,
    which: "control",
    args: args
  }, options);

  const candidateArgs = safeCandidateCall(experiment, "beforeRun", args);

  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  const candidateOptions = assign({
    fn: experiment.candidate,
    which: "candidate",
    args: candidateArgs
  }, options);

  return {controlOptions, candidateOptions}

}

function safeCandidateCall (experiment, method, args) {
  if (typeof experiment[method] !== "function") {
    throw new Error(`Invoked with invalid method ${method}`);
  }

  let result;

  try {
    result = experiment[method](args);
  } catch (e) {
    // users should be able to create handlers for errors
    // thrown by different kinds of user-configured functions
    // errors BEFORE candidate invocation should cancel it
    throw e
  }

  return result;

}


module.exports = {
  createOptions,
  createExperimentFactory
}
