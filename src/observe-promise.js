const RESULT = "result";
const ERROR = "error";

function observePromise (exp, {candidate, control}) {
  const promises = [control, candidate].map(makePromiseObservation);
  return Promise.all(promises).then(function (observations) {
    exp.emitTrial(...observations);

    if (observations[0].error) {
      return Promise.reject(observations[0].error);
    }

    return Promise.resolve(observations[0].result);
  });
}

function makePromiseObservation (params) {

  const {fn, ctx, args, metadata} = params;
  const observation = {args, metadata};
  const start = Date.now();

  function onComplete (prop) {
    return function (value) {
      observation[prop] = value;
      observation.duration = Date.now() - start;
      return Promise.resolve(observation);
    }
  }

  return fn.apply(ctx, args).then(onComplete(RESULT), onComplete(ERROR));
}

module.exports = observePromise;
