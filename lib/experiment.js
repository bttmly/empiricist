"use strict";

var assert = require("assert");

var experimentProto = require("./experiment-proto");

var _require = require("./util");

var shouldRun = _require.shouldRun;
var makeId = _require.makeId;

function experimentFactory(name, init) {

  assert.equal(typeof name, "string", "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert.equal(typeof init, "function", "If provided, init argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    assert.equal(typeof experiment.control, "function", "Can't run experiment without control");

    var ctx = experiment._context || this;

    if (!shouldRun(experiment, args)) {
      return experiment.control.apply(ctx, args);
    }

    var options = { args: args, ctx: ctx, metadata: experiment._metadata };

    var controlOptions = Object.assign({
      fn: experiment.control,
      which: "control",
      args: args
    }, options);

    var candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate",
      args: experiment._beforeRun(args)
    }, options);

    var trial = {
      id: makeId(),
      name: name,
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

  var start = Date.now();

  var observation = { args: args, metadata: metadata };

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