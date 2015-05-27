const assert = require("assert");
const {isFunction, isString} = require("util");

const assign = require("object-assign");

const Experiment = require("./experiment");

function createExperimentFactory (wrapper, Ctor) {

  Ctor = Ctor || Experiment;

  assertClassImplementsExperiment(Ctor);

  return function (name, executor) {

    assert(isString(name), `'name' argument must be a string, found ${name}`);
    assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

    const experiment = new Ctor(name);

    executor.call(experiment, experiment);

    Ctor.assertValid(experiment);

    return wrapper(experiment);
  };

}

function createOptions (exp, args, ctx) {

  const options = {
    ctx: ctx,
    metadata: exp._metadata,
  };

  const controlOptions = assign({
    fn: exp.control,
    which: "control",
    args: args
  }, options);

  const candidateArgs = exp.beforeRun(args);

  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  const candidateOptions = assign({
    fn: exp.candidate,
    which: "candidate",
    args: candidateArgs
  }, options);

  return {controlOptions, candidateOptions};

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

function assertClassImplementsExperiment (ClassConstructor) {
  assert(isFunction(ClassConstructor));
  Object.getOwnPropertyNames(Experiment.prototype).forEach((m) => {
    assert(isFunction(ClassConstructor.prototype[m]));
  });
}

module.exports = {
  createOptions,
  createExperimentFactory
}
