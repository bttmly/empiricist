"use strict";

var assert = require("assert");

var assign = require("object-assign");

var _require = require("./pkg-util");

var isFunction = _require.isFunction;
var isString = _require.isString;

var BaseExperiment = require("./experiment");

function createExperimentFactory(wrapper, Ctor) {

  Ctor = Ctor || BaseExperiment;

  assertClassImplementsExperiment(Ctor);

  return function experimentFactory(name, executor) {

    assert(isString(name), "'name' argument must be a string, found " + name);
    assert(isFunction(executor), "'executor' argument must be a function, found " + executor);
    var experiment = new Ctor(name);
    executor.call(experiment, experiment);
    Ctor.assertValid(experiment);

    return wrapper(experiment);
  };
}

function experimentFactoryFactory(trialProducer, Experiment) {

  Experiment = Experiment || BaseExperiment;

  assertClassImplementsExperiment(Experiment);

  return function experimentFactory(name, executor) {

    assert(isString(name), "'name' argument must be a string, found " + name);
    assert(isFunction(executor), "'executor' argument must be a function, found " + executor);

    var exp = new Experiment(name);
    executor.call(exp, exp);
    Experiment.assertValid(exp);

    function experimentInstance() {
      var ctx = exp.contextWasSet ? exp.context : this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (!exp.enabled.apply(exp, args)) {
        exp.emit("skip", args);
        return exp.control.apply(ctx, args);
      }

      return trialProducer(createParams(exp, args, ctx), exp);
    }

    return assign(experimentInstance, exp.control);
  };
}

function createParams(exp, args, ctx) {

  var options = {
    ctx: ctx,
    metadata: exp.metadata
  };

  var controlParams = assign({
    fn: exp.control,
    which: "control",
    args: args
  }, options);

  var candidateArgs = exp.beforeRun(args);

  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  var candidateParams = assign({
    fn: exp.candidate,
    which: "candidate",
    args: candidateArgs
  }, options);

  return { controlParams: controlParams, candidateParams: candidateParams };
}

function safeMethodCall(experiment, method) {
  if (typeof experiment[method] !== "function") {
    throw new Error("Tried to call invalid method " + method);
  }

  var result = undefined;

  for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    args[_key2 - 2] = arguments[_key2];
  }

  try {
    result = experiment[method].apply(experiment, args);
  } catch (e) {
    experiment.emit(method + "Error", e, args);
  }

  return result;
}

function assertClassImplementsExperiment(MaybeExperiment) {
  assert(isFunction(MaybeExperiment));
  Object.getOwnPropertyNames(BaseExperiment.prototype).forEach(function (m) {
    assert(isFunction(MaybeExperiment.prototype[m]));
  });
}

module.exports = {
  createParams: createParams,
  createExperimentFactory: createExperimentFactory,
  safeMethodCall: safeMethodCall,
  experimentFactoryFactory: experimentFactoryFactory
};