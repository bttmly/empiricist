"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function observePromise(exp, params) {
  var promises = [params.control, params.candidate].map(makePromiseObservation);
  return Promise.all(promises).then(function (observations) {
    // console.log("trial then...");
    exp.emitTrial.apply(exp, _toConsumableArray(observations));
    // console.log("after emit...");

    if (observations[0].error) {
      // console.log("rejecting with control error", observations[0].error);
      return Promise.reject(observations[0].error);
    }

    // console.log("resolving with control result", observations[0].result);
    return Promise.resolve(observations[0].result);
  })

  // .catch(function (err) {
  //   console.log("UNEXPECTED ERROR!");
  //   console.log(err);
  //   console.log(err.stack);
  //   return err;
  // })
  ;
}

function makePromiseObservation(params) {
  var fn = params.fn;
  var ctx = params.ctx;
  var args = params.args;
  var metadata = params.metadata;

  var observation = { args: args, metadata: metadata };
  var start = Date.now();

  function onSuccess(d) {
    // console.log("onSuccess", params.which);
    observation.result = d;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  function onError(e) {
    // console.log("onError", params.which);
    observation.error = e;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  return fn.apply(ctx, args).then(onSuccess, onError);
}

module.exports = observePromise;