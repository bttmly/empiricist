"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var wrapObserver = require("./wrap-observer");

function observePromiseExperiment(exp, params) {
  var promises = [params.control, params.candidate].map(makePromiseObservation);
  return Promise.all(promises).then(function (observations) {
    exp.emitTrial.apply(exp, _toConsumableArray(observations));
    return trial.control.error ? Promise.reject(trial.control.error) : Promise.resolve(trial.control.result);
  });
}

function makePromiseObservation(options) {
  var fn = options.fn;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;

  var observation = { args: args, metadata: metadata };
  var start = Date.now();

  function onSuccess(d) {
    observation.result = d;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  function onError(e) {
    observation.error = e;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  return fn.apply(ctx, args).then(onSuccess, onError);
}

module.exports = wrapObserver(observePromiseExperiment);
module.exports.observer = observePromiseExperiment;