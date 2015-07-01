"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var wrapObserver = require("./wrap-observer");

function observeSyncExperiment(exp, params) {
  var observations = [params.control, params.candidate].map(makeSyncObservation);
  exp.emitTrial.apply(exp, _toConsumableArray(observations));
  return observations[0].result;
}

function makeSyncObservation(params) {
  var fn = params.fn;
  var ctx = params.ctx;
  var args = params.args;
  var metadata = params.metadata;
  var which = params.which;

  var observation = { args: args, metadata: metadata, type: which };
  var start = Date.now();

  if (which === "candidate") {
    try {
      observation.result = fn.apply(ctx, args);
    } catch (e) {
      observation.result = null;
      observation.error = e;
    }
  } else {
    observation.result = fn.apply(ctx, args);
  }

  observation.duration = Date.now() - start;
  return observation;
}

module.exports = wrapObserver(observeSyncExperiment);
module.exports.observer = observeSyncExperiment;