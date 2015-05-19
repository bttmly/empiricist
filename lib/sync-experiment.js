"use strict";

var _bind = Function.prototype.bind;

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

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
  var _exp = new Experiment();
  executor.call(_exp, _exp);

  assert(isFunction(_exp.control), "Experiment's control function must be set with `e.use()`");

  function experiment() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var ctx = _exp._context || this;

    if (!shouldRun(_exp, args)) {
      return _exp.control.apply(ctx, args);
    }var options = { ctx: ctx, metadata: _exp._metadata };

    var controlOptions = assign({
      fn: _exp.control,
      which: "control",
      args: args
    }, options);

    var candidateArgs = _exp._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    var candidateOptions = assign({
      fn: _exp.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    if (this instanceof experiment) {
      candidateOptions.construct = controlOptions.construct = true;
    }

    var trial = {
      name: name,
      id: makeId(),
      control: makeSyncObservation(controlOptions),
      candidate: makeSyncObservation(candidateOptions)
    };

    _exp._report(_exp._clean(trial));

    return trial.control.returned;
  };

  // now make the returned function look superficially like the control...
  assign(experiment, _exp.control);
  swapPrototypes(experiment, _exp.control);

  return experiment;
}

function makeSyncObservation(options) {
  var args = options.args;
  var fn = options.fn;
  var which = options.which;
  var metadata = options.metadata;
  var ctx = options.ctx;
  var construct = options.construct;

  var start = Date.now(),
      observation = { args: args, metadata: metadata, type: which };

  if (which === "candidate") {
    try {
      observation.returned = construct ? new (_bind.apply(fn, [null].concat(_toConsumableArray(args))))() : fn.apply(ctx, args);
    } catch (e) {
      observation.returned = null;
      observation.threw = e;
    }
  } else {
    observation.returned = construct ? new (_bind.apply(fn, [null].concat(_toConsumableArray(args))))() : fn.apply(ctx, args);
  }

  observation.duration = Date.now() - start;
  return observation;
}

// this essentially steals the control's prototoype, and sort of
// makes the control inherit from the experiment. The outcome is
// that an instance of the experiment reports as such, since the
// experiment is now above the control in the prototype chain
//
// This might be really stupid.
//
// Is there a way to avoid doing this mumbo-jumbo for "vanilla"
// functions (i.e. those not intended to be called with `new`)?
// Alternately, perhaps the caller should ask for it to be performed
// by configuring something in the executor. Maybe we just document
// that constructors aren't supported.

function swapPrototypes(experiment, control) {
  var orig = control.prototype;
  var derived = Object.create(orig);
  experiment.prototype = orig;
  control.prototype = derived;
}

module.exports = syncExperimentFactory;