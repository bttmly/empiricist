const wrapObserver = require("./wrap-observer");

function observePromiseExperiment (exp, params) {
  const promises = [params.control, params.candidate].map(makePromiseObservation);
  return Promise.all(promises).then(function (observations) {
    exp.emitTrial(...observations);
    return trial.control.error ?
      Promise.reject(trial.control.error) :
      Promise.resolve(trial.control.result);
  });
}

function makePromiseObservation (options) {

  const {fn, ctx, args, metadata} = options;
  const observation = {args, metadata};
  const start = Date.now();

  function onSuccess (d) {
    observation.result = d;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  function onError (e) {
    observation.error = e;
    observation.duration = Date.now() - start;
    return Promise.resolve(observation);
  }

  return fn.apply(ctx, args).then(onSuccess, onError);
}

module.exports = wrapObserver(observePromiseExperiment);
module.exports.observer = observePromiseExperiment;
