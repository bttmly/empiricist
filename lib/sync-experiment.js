"use strict";

var _bind = Function.prototype.bind;

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assign = require("object-assign");

var _require = require("./shared");

var createOptions = _require.createOptions;
var createExperimentFactory = _require.createExperimentFactory;

var _require2 = require("./pkg-util");

var makeId = _require2.makeId;

function wrapSyncExperiment(exp) {

  function experimentFunc() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var ctx = exp.context || this;
    var trial = { name: exp.name, id: makeId() };

    if (!exp.enabled.apply(exp, args)) {
      return exp.control.apply(ctx, args);
    }

    var _createOptions = createOptions(exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    if (this instanceof experimentFunc) {
      candidateOptions.construct = controlOptions.construct = true;
    }

    trial.control = makeSyncObservation(controlOptions);
    trial.candidate = makeSyncObservation(candidateOptions);

    exp.report(exp.clean(trial));
    return trial.control.result;
  }

  // now make the returned function look superficially like the control...
  assign(experimentFunc, exp.control);
  swapPrototypes(experimentFunc, exp.control);

  return experimentFunc;
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

  /* eslint-disable new-cap */
  if (which === "candidate") {
    try {
      observation.result = construct ? new (_bind.apply(fn, [null].concat(_toConsumableArray(args))))() : fn.apply(ctx, args);
    } catch (e) {
      observation.result = null;
      observation.error = e;
    }
  } else {
    observation.result = construct ? new (_bind.apply(fn, [null].concat(_toConsumableArray(args))))() : fn.apply(ctx, args);
  }
  /* eslint-enable new-cap */

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

// ExperimentalMammal = syncExperiment(Mammal);
// Original hierarchy: Animal -> Mammal
// New hierarchy: Animal -> ExperimentalMammal -> Mammal

function swapPrototypes(experiment, control) {
  var orig = control.prototype;
  var derived = Object.create(orig);
  experiment.prototype = orig;
  control.prototype = derived;
}

module.exports = createExperimentFactory(wrapSyncExperiment);