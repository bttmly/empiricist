"use strict";

var assert = require("assert");

var experimentProto = require("./experiment-proto");

var _require = require("./util");

var isFunction = _require.isFunction;
var isString = _require.isString;
var shouldRun = _require.shouldRun;
var makeId = _require.makeId;

function experimentFactory(name, init) {

  assert(isString(name), "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert(isFunction(init), "If provided, init argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    assert(isFunction(experiment.control), "Can't run experiment without control");

    var ctx = experiment._context || this;

    if (!shouldRun(experiment, args)) {
      return experiment.control.apply(ctx, args);
    }var options = { ctx: ctx, metadata: experiment._metadata };

    var controlOptions = Object.assign({
      fn: experiment.control,
      which: "control",
      args: args
    }, options);

    var candidateArgs = experiment._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    var candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    var trial = {
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

function makeObservation(options) {
  var args = options.args;
  var fn = options.fn;
  var which = options.which;
  var metadata = options.metadata;
  var ctx = options.ctx;

  var start = Date.now(),
      observation = { args: args, metadata: metadata };

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