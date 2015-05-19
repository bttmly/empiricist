"use strict";

var assert = require("assert");

var assign = require("object-assign");

var Experiment = require("./experiment");

var _require = require("./util");

var isFunction = _require.isFunction;
var isString = _require.isString;
var shouldRun = _require.shouldRun;
var makeId = _require.makeId;

function syncExperimentFactory(name, executor) {

  assert(isString(name), "'name' argument must be a string, found " + name);
  assert(isFunction(executor), "'executor' argument must be a function, found " + executor);

  // the experiment object is private, it is only revealed to the caller inside the executor function
  var exp = new Experiment();
  executor.call(exp, exp);

  assert(isFunction(exp.control), "Experiment's control function must be set with `e.use()`");

  var result = function result() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var ctx = exp._context || this;

    if (!shouldRun(exp, args)) {
      return exp.control.apply(ctx, args);
    }var options = { ctx: ctx, metadata: exp._metadata };

    var controlOptions = assign({
      fn: exp.control,
      which: "control",
      args: args
    }, options);

    var candidateArgs = exp._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    var candidateOptions = assign({
      fn: exp.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    var trial = {
      name: name,
      id: makeId(),
      control: makeSyncObservation(controlOptions),
      candidate: makeSyncObservation(candidateOptions)
    };

    exp._report(exp._clean(trial));

    return trial.control.returned;
  };

  // copy own properties from control over to the returned function
  assign(result, exp.control);

  return result;
}

function makeSyncObservation(options) {
  var args = options.args;
  var fn = options.fn;
  var which = options.which;
  var metadata = options.metadata;
  var ctx = options.ctx;

  var start = Date.now(),
      observation = { args: args, metadata: metadata, type: which };

  if (which === "candidate") {
    try {
      observation.returned = fn.apply(ctx, args);
    } catch (e) {
      observation.returned = null;
      observation.threw = e;
    }
  } else {
    observation.returned = fn.apply(ctx, args);
  }

  observation.duration = Date.now() - start;
  return observation;
}

module.exports = syncExperimentFactory;