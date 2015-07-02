"use strict";

var assert = require("assert");
var assign = require("object-assign");

var _require = require("./pkg-util");

var isFunction = _require.isFunction;
var isString = _require.isString;

var BaseExperiment = require("./experiment");

function wrapObserver(observe, Experiment) {

  Experiment = Experiment || BaseExperiment;

  assertClassImplementsExperiment(Experiment);

  return function experimentFactory(name, executor) {

    assert(isString(name), "'name' argument must be a string, found " + name);
    assert(isFunction(executor), "'executor' argument must be a function, found " + executor);

    var exp = new Experiment(name);
    executor.call(exp, exp);
    Experiment.assertValid(exp);

    return function experimentInstance() {
      var ctx = exp.contextWasSet ? exp.context : this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (!exp.enabled.apply(exp, args)) {
        exp.emit("skip", args);
        return exp.control.apply(ctx, args);
      }

      return observe(exp, createParams(exp, args, ctx));
    };

    // hmm...
    // return assign(experimentInstance, exp.control);
  };
}

function createParams(exp, args, ctx) {

  var baseParams = {
    ctx: ctx,
    metadata: exp.metadata
  };

  var control = assign({
    fn: exp.control,
    which: "control",
    args: args
  }, baseParams);

  var candidateArgs = exp.beforeRun(args);

  assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

  var candidate = assign({
    fn: exp.candidate,
    which: "candidate",
    args: candidateArgs
  }, baseParams);

  return { control: control, candidate: candidate };
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

function assertClassImplementsExperiment(MaybeExperiment) {
  assert(isFunction(MaybeExperiment));
  Object.getOwnPropertyNames(BaseExperiment.prototype).forEach(function (m) {
    assert(isFunction(MaybeExperiment.prototype[m]));
  });
}

module.exports = wrapObserver;