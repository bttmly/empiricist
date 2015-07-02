const assert = require("assert");
const assign = require("object-assign");

const {isFunction, isString} = require("./pkg-util");
const BaseExperiment = require("./experiment");

function wrapObserver (observe, Experiment) {

  Experiment = Experiment || BaseExperiment;

  assertClassImplementsExperiment(Experiment);

  return function experimentFactory (name, executor) {

    assert(isString(name), `'name' argument must be a string, found ${name}`);
    assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

    const exp = new Experiment(name);
    executor.call(exp, exp);
    Experiment.assertValid(exp);

    return function experimentInstance (...args) {
      const ctx = exp.contextWasSet ? exp.context : this;

      if (!exp.enabled(...args)) {
        exp.emit("skip", args);
        return exp.control.apply(ctx, args);
      }

      return observe(exp, createParams(exp, args, ctx));
    };

    // hmm...
    // return assign(experimentInstance, exp.control);
  };

}

function createParams (exp, args, ctx) {

  const baseParams = {
    ctx: ctx,
    metadata: exp.metadata,
  };

  const control = assign({
    fn: exp.control,
    which: "control",
    args: args,
  }, baseParams);

  const candidateArgs = exp.beforeRun(args);

  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  const candidate = assign({
    fn: exp.candidate,
    which: "candidate",
    args: candidateArgs,
  }, baseParams);

  return {control, candidate};

}

// function safeMethodCall (experiment, method, ...args) {
//   if (typeof experiment[method] !== "function") {
//     throw new Error(`Tried to call invalid method ${method}`);
//   }

//   let result;

//   try {
//     result = experiment[method](...args);
//   } catch (e) {
//     experiment.emit(`${method}Error`, e, args);
//   }

//   return result;
// }

function assertClassImplementsExperiment (MaybeExperiment) {
  assert(isFunction(MaybeExperiment));
  Object.getOwnPropertyNames(BaseExperiment.prototype).forEach((m) => {
    assert(isFunction(MaybeExperiment.prototype[m]));
  });
}

module.exports = wrapObserver;
