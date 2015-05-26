"use strict";

var _bind = Function.prototype.bind;

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");

var assign = require("object-assign");

var Experiment = require("./experiment");

var _require = require("./shared");

var createOptions = _require.createOptions;
var createExperiment = _require.createExperiment;

var _require2 = require("./pkg-util");

var shouldRun = _require2.shouldRun;
var makeId = _require2.makeId;

function wrapSyncExperiment(_exp) {

  function func() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var ctx = _exp._context || this;
    var trial = { name: _exp.name, id: makeId() };

    if (!shouldRun(_exp, args)) {
      return _exp.control.apply(ctx, args);
    }

    var _createOptions = createOptions(_exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    if (this instanceof func) {
      candidateOptions.construct = controlOptions.construct = true;
    }

    trial.control = makeSyncObservation(controlOptions), trial.candidate = makeSyncObservation(candidateOptions);

    _exp._report(_exp._clean(trial));
    return trial.control.returned;
  };

  // now make the returned function look superficially like the control...
  assign(func, _exp.control);
  swapPrototypes(func, _exp.control);

  return func;
}

function makeSyncObservation(options) {
  var fn = options.fn;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;
  var construct = options.construct;

  var observation = { args: args, metadata: metadata, type: which };
  var start = Date.now();

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

module.exports = createExperiment(wrapSyncExperiment);