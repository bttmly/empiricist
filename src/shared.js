const assert = require("assert");

const assign = require("object-assign");

const {isFunction, isString} = require("./pkg-util");
const Experiment = require("./experiment");



function createExperimentFactory (wrapper, Ctor) {

  Ctor = Ctor || Experiment;

  assertClassImplementsExperiment(Ctor);

  return function experimentFactory (name, executor) {

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
    metadata: exp._metadata
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




function safeMethodCall (experiment, method, ...args) {
  if (typeof experiment[method] !== "function") {
    throw new Error(`Tried to call invalid method ${method}`);
  }

  let result;

  try {
    result = experiment[method](...args);
  } catch (e) {
    experiment.emit(`${method}Error`, e, args);
  }

  return result;
}




function assertClassImplementsExperiment (MaybeExperiment) {
  assert(isFunction(MaybeExperiment));
  Object.getOwnPropertyNames(Experiment.prototype).forEach((m) => {
    assert(isFunction(MaybeExperiment.prototype[m]));
  });
}

module.exports = {
  createOptions,
  createExperimentFactory,
  safeMethodCall
};
