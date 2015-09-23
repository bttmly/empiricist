const assert = require("assert");

const {isFunction, isString, ownMethods} = require("./pkg-util");
const BaseExperiment = require("./experiment");

function wrapObserver (observe, Experiment) {

  assert(isFunction(observe), "First argument must be a function");

  if (Experiment !== BaseExperiment) {
    assertClassImplementsExperiment(Experiment);
  }

  return function experimentFactory (name, executor) {

    assert(isString(name), `'name' argument must be a string, found ${name}`);
    assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

    // create an experiment instance
    const exp = new Experiment(name);
    // invoke the executor, exposing the experiment instance, to the caller
    executor.call(exp, exp);
    // verify the caller has correctly initialized the experiment
    Experiment.assertValid(exp);

    return function experimentInstance (...args) {
      const ctx = exp.contextWasSet ? exp.context : this;

      if (!exp.enabled(...args)) {
        exp.emit("skip", args);
        return exp.control.apply(ctx, args);
      }

      return observe(exp, createParams(exp, args, ctx));
    };

  };

}

function createParams (exp, args, ctx) {

  const candidateArgs = exp.beforeRun(args);
  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  return {
    control: {
      fn: exp.control,
      args: args,
      ctx,
    },
    candidate: {
      fn: exp.candidate,
      args: candidateArgs,
      ctx,
    },
  };

}


function assertClassImplementsExperiment (MaybeExperiment) {
  let msg = `Class ${MaybeExperiment.name} must implement the Experiment interface`.

  assert(isFunction(MaybeExperiment), msg);
  
  ownMethods(BaseExperiment).forEach(m => {
    assert(isFunction(BaseExperiment[m]), msg);
  });

  ownMethods(BaseExperiment.prototype).forEach(m => {
    assert(isFunction(MaybeExperiment.prototype[m]), msg);
  });
}

module.exports = wrapObserver;
