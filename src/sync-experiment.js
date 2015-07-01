const wrapObserver = require("./wrap-observer");

function observeSyncExperiment (exp, params) {
  const observations = [params.control, params.candidate].map(makeSyncObservation);
  exp.emitTrial(...observations);
  return observations[0].result;
}

function makeSyncObservation (params) {
  const {fn, ctx, args, metadata, which} = params;
  const observation = {args, metadata, type: which};
  const start = Date.now();

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
