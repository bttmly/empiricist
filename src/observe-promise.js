const {ERROR, RESULT} = require("./strings");

function observePromise (exp, {candidate, control}) {
  const promises = [control, candidate].map(makePromiseObservation);
  return Promise.all(promises).then(function ([controlObs, candidateObs]) {
    exp.emitTrial(controlObs, candidateObs);

    if (controlObs.error != null) {
      return Promise.reject(controlObs.error);
    }

    return Promise.resolve(controlObs.result);
  });
}

function makePromiseObservation (params) {

  const {fn, ctx, args, metadata} = params;
  const observation = {args, metadata};
  const start = Date.now();

  function onComplete (prop) {
    return function (value) {
      if (value !== undefined) observation[prop] = value;
      observation.duration = Date.now() - start;
      return Promise.resolve(observation);
    }
  }

  return fn.apply(ctx, args).then(onComplete(RESULT), onComplete(ERROR));
}

module.exports = observePromise;
