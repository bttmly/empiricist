"use strict";

var assert = require("assert");

var assign = require("object-assign");

var _require = require("./pkg-util");

var isFunction = _require.isFunction;
var isString = _require.isString;

var Experiment = require("./experiment");

function createExperimentFactory(wrapper, Ctor) {

  Ctor = Ctor || Experiment;

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

function createOptions(exp, args, ctx) {

  var options = {
    ctx: ctx,
    metadata: exp.metadata
  };

  var controlOptions = assign({
    fn: exp.control,
    which: "control",
    args: args
  }, options);

  var candidateArgs = exp.beforeRun(args);

  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  var candidateOptions = assign({
    fn: exp.candidate,
    which: "candidate",
    args: candidateArgs
  }, options);

  return { controlOptions: controlOptions, candidateOptions: candidateOptions };
}

function safeMethodCall(experiment, method) {
  if (typeof experiment[method] !== "function") {
    throw new Error("Tried to call invalid method " + method);
  }

  var result = undefined;

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
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
  Object.getOwnPropertyNames(Experiment.prototype).forEach(function (m) {
    assert(isFunction(MaybeExperiment.prototype[m]));
  });
}

module.exports = {
  createOptions: createOptions,
  createExperimentFactory: createExperimentFactory,
  safeMethodCall: safeMethodCall
};