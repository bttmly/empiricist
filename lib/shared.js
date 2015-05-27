"use strict";

var assert = require("assert");

var assign = require("object-assign");

var Experiment = require("./experiment-redux");

var _require = require("util");

var isFunction = _require.isFunction;
var isString = _require.isString;

function createExperiment(wrapper) {

  return function (name, executor) {

    assert(isString(name), "'name' argument must be a string, found " + name);
    assert(isFunction(executor), "'executor' argument must be a function, found " + executor);

    var experiment = new Experiment(name);

    executor.call(experiment, experiment);

    assert(Experiment.isValid(experiment));

    return wrapper(experiment);
  };
}

function createOptions(experiment, args, ctx) {

  var options = {
    ctx: ctx,
    metadata: experiment._metadata };

  var controlOptions = assign({
    fn: experiment.control,
    which: "control",
    args: args
  }, options);

  var candidateArgs = safeCandidateCall(experiment, "_beforeRun", args);

  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  var candidateOptions = assign({
    fn: experiment.candidate,
    which: "candidate",
    args: candidateArgs
  }, options);

  return { controlOptions: controlOptions, candidateOptions: candidateOptions };
}

function safeCandidateCall(experiment, method, args) {
  if (typeof experiment[method] !== "function") {
    throw new Error("Invoked with invalid method " + method);
  }

  var result = undefined;

  try {
    result = experiment[method](args);
  } catch (e) {
    // users should be able to create handlers for errors
    // thrown by different kinds of user-configured functions
    // errors BEFORE candidate invocation should cancel it
    throw e;
  }

  return result;
}

module.exports = {
  createOptions: createOptions,
  createExperiment: createExperiment
};